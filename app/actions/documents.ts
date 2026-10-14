'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { allow } from '@/lib/rate-limit'
import { audit } from '@/lib/audit'
import { notify } from '@/lib/notify'
import { dbError, getStr, isUuid } from '@/lib/form'
import { ALLOWED_FILES, BUCKET, MAX_UPLOAD_BYTES } from '@/lib/constants'
import type { ActionState } from '@/lib/types'

function refresh(caseId?: string) {
  revalidatePath('/lawyer/documents')
  revalidatePath('/client/documents')
  if (caseId) {
    revalidatePath(`/lawyer/cases/${caseId}`)
    revalidatePath(`/client/cases/${caseId}`)
  }
}

// Used by lawyers and clients. Access is decided by row level security on `cases`
// and `documents`; the file itself goes into a PRIVATE bucket via the service role.
export async function uploadDocument(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireUser()
  if (me.role !== 'lawyer' && me.role !== 'client') return { error: 'Not allowed.' }

  const caseId = getStr(formData, 'case_id', 40)
  if (!isUuid(caseId)) return { error: 'Choose a case.' }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a file to upload.' }
  if (file.size > MAX_UPLOAD_BYTES) return { error: 'That file is too large (maximum 8 MB).' }

  const ext = (file.name.split('.').pop() ?? '').toLowerCase()
  const contentType = ALLOWED_FILES[ext]
  if (!contentType) return { error: 'This file type is not allowed. Use PDF, Word, Excel, PowerPoint, text, CSV or an image.' }

  if (!(await allow(`upload:${me.id}`, 40, 3600))) return { error: 'Too many uploads. Try again later.' }

  const supabase = await createClient()
  const { data: found } = await supabase.from('cases').select('id, lawyer_id, client_id, case_number').eq('id', caseId).maybeSingle()
  if (!found) return { error: 'Case not found.' }

  // Clients can only upload files that the lawyer can see; lawyers choose.
  const visible = me.role === 'client' ? true : formData.get('visible_to_client') === 'on'

  const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-100)
  const path = `${caseId}/${crypto.randomUUID()}-${safeName}`

  const admin = createAdminClient()
  const up = await admin.storage.from(BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType,
    upsert: false,
  })
  if (up.error) {
    console.error('storage upload failed:', up.error.message)
    return { error: 'Upload failed. Did you run the latest supabase/schema.sql?' }
  }

  const { data: row, error } = await supabase
    .from('documents')
    .insert({
      case_id: caseId,
      uploaded_by: me.id,
      name: file.name.slice(0, 200),
      storage_path: path,
      size_bytes: file.size,
      mime_type: contentType,
      visible_to_client: visible,
    })
    .select('id')
    .single()

  if (error || !row) {
    await admin.storage.from(BUCKET).remove([path]) // don't leave orphan files
    return { error: error ? dbError(error) : 'Could not save the document.' }
  }

  await audit(me.id, 'document.uploaded', row.id, { case_id: caseId, name: file.name.slice(0, 200) })

  // lawyer shared a file -> tell the client; client sent a file -> tell the lawyer
  if (me.role === 'lawyer' && visible) {
    await notify({
      toUserId: found.client_id,
      subject: `A document was shared on case ${found.case_number}`,
      heading: 'New document',
      body: `Your lawyer shared a document on case ${found.case_number}.`,
      path: `/client/cases/${caseId}?tab=documents`,
      button: 'View documents',
      throttleKey: `doc:${caseId}`,
      throttleSeconds: 300,
    })
  } else if (me.role === 'client') {
    await notify({
      toUserId: found.lawyer_id,
      subject: `Your client sent a document on case ${found.case_number}`,
      heading: 'New document from your client',
      body: `A document was uploaded to case ${found.case_number}.`,
      path: `/lawyer/cases/${caseId}?tab=documents`,
      button: 'View documents',
      throttleKey: `doc:${caseId}`,
      throttleSeconds: 300,
    })
  }
  refresh(caseId)
  return { success: `Uploaded ${file.name}.` }
}

export async function setDocumentShared(formData: FormData) {
  const me = await requireUser()
  if (me.role !== 'lawyer') return
  const id = getStr(formData, 'id', 40)
  if (!isUuid(id)) return

  const supabase = await createClient()
  const share = formData.get('visible') === 'true'
  const { data } = await supabase
    .from('documents')
    .update({ visible_to_client: share })
    .eq('id', id)
    .select('id, case_id')
    .maybeSingle()

  if (data && share) {
    const { data: c } = await supabase.from('cases').select('client_id, case_number').eq('id', data.case_id).maybeSingle()
    if (c) {
      await notify({
        toUserId: c.client_id,
        subject: `A document was shared on case ${c.case_number}`,
        heading: 'New document',
        body: `Your lawyer shared a document on case ${c.case_number}.`,
        path: `/client/cases/${data.case_id}?tab=documents`,
        button: 'View documents',
        throttleKey: `doc:${data.case_id}`,
        throttleSeconds: 300,
      })
    }
  }
  refresh(data?.case_id)
}

export async function deleteDocument(formData: FormData) {
  const me = await requireUser()
  const id = getStr(formData, 'id', 40)
  if (!isUuid(id)) return

  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('documents')
    .select('id, case_id, storage_path, name')
    .eq('id', id)
    .maybeSingle()
  if (!doc) return

  // RLS: lawyers can delete any document of their cases, clients only their own uploads.
  const { data: deleted } = await supabase.from('documents').delete().eq('id', id).select('id')
  if (deleted?.length) {
    await createAdminClient().storage.from(BUCKET).remove([doc.storage_path])
    await audit(me.id, 'document.deleted', id, { case_id: doc.case_id, name: doc.name })
  }
  refresh(doc.case_id)
}
