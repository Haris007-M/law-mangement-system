import ActionForm from '@/components/ActionForm'
import Card from '@/components/Card'
import DocumentList from '@/components/DocumentList'
import PageHeader from '@/components/PageHeader'
import { Checkbox, FileInput, Select } from '@/components/Field'
import { requireRole } from '@/lib/auth'
import { getNames } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'
import type { DocumentRow } from '@/lib/types'
import { uploadDocument } from '@/app/actions/documents'

export default async function LawyerDocumentsPage() {
  const me = await requireRole('lawyer')
  const supabase = await createClient()

  const [docRes, caseRes] = await Promise.all([
    supabase.from('documents').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('cases').select('id, title, case_number').eq('lawyer_id', me.id).order('title'),
  ])
  const docs = (docRes.data ?? []) as DocumentRow[]
  const cases = (caseRes.data ?? []) as { id: string; title: string; case_number: string }[]
  const caseTitles = Object.fromEntries(cases.map((c) => [c.id, c.title]))
  const names = await getNames(supabase, docs.map((d) => d.uploaded_by))

  return (
    <>
      <PageHeader title="Documents" description="Every file across your cases. Files are stored privately and only open through a secure, expiring link." />
      <div className="space-y-6">
        <Card title="Upload a document">
          {cases.length === 0 ? (
            <p className="text-sm text-slate-600">Create a case first, then you can attach documents to it.</p>
          ) : (
            <ActionForm action={uploadDocument} submitLabel="Upload" pendingLabel="Uploading...">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Case" name="case_id" required emptyLabel="Select a case" options={cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title}` }))} />
                <FileInput />
              </div>
              <Checkbox name="visible_to_client" label="Share with the client" />
            </ActionForm>
          )}
        </Card>
        <Card title={`All documents (${docs.length})`} padded={false}>
          <DocumentList docs={docs} caseTitles={caseTitles} names={names} role="lawyer" meId={me.id} />
        </Card>
      </div>
    </>
  )
}
