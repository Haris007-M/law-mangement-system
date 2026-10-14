'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createAccount, createResultToState, readPerson, reissueInvite } from '@/lib/accounts'
import { createAdminClient } from '@/lib/supabase/admin'
import { allow } from '@/lib/rate-limit'
import { resetUserMfa } from '@/lib/mfa-admin'
import { isUuid } from '@/lib/form'
import { audit } from '@/lib/audit'
import type { ActionState } from '@/lib/types'

export async function inviteClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  // The lawyer id comes from the verified session, never from the form.
  const lawyer = await requireRole('lawyer')

  const person = readPerson(formData)
  if (!person.ok) return { error: person.error, fields: person.fields }
  const fields = { email: person.email, full_name: person.fullName }

  if (!(await allow(`invite:${lawyer.id}`, 30, 3600))) {
    return { error: 'Too many invitations in the last hour. Try again later.', fields }
  }

  const result = await createAccount({
    email: person.email,
    fullName: person.fullName,
    role: 'client',
    lawyerId: lawyer.id,
    invitedBy: lawyer.full_name ?? lawyer.email,
  })

  if (result.ok) {
    await audit(lawyer.id, 'client.created', result.userId, { email: person.email })
    revalidatePath('/lawyer', 'layout')
  }
  return createResultToState(result, person.email, fields, 'Client')
}

export async function resendClientInvite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const lawyer = await requireRole('lawyer')
  const id = String(formData.get('id') ?? '')
  if (!(await allow(`invite:${lawyer.id}`, 30, 3600))) return { error: 'Too many requests. Try again later.' }

  const res = await reissueInvite(
    id,
    { role: 'client', lawyerId: lawyer.id },
    lawyer.full_name ?? lawyer.email
  )
  if (res?.success || res?.link) await audit(lawyer.id, 'invite.resent', id)
  return res
}

export async function setClientActive(formData: FormData) {
  const lawyer = await requireRole('lawyer')

  const id = String(formData.get('id') ?? '')
  const active = formData.get('active') === 'true'
  if (!id) return

  // .eq('lawyer_id', lawyer.id): a lawyer can only touch their OWN clients.
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .update({ is_active: active })
    .eq('id', id)
    .eq('role', 'client')
    .eq('lawyer_id', lawyer.id)
    .select('id')
  if (data?.length) await audit(lawyer.id, active ? 'client.reactivated' : 'client.suspended', id)

  revalidatePath('/lawyer', 'layout')
}

// Lost phone: remove a client's authenticator (only for your own clients).
export async function resetClientTwoFactor(formData: FormData) {
  const lawyer = await requireRole('lawyer')
  const id = String(formData.get('id') ?? '')
  if (!isUuid(id)) return

  const { data: target } = await createAdminClient()
    .from('profiles').select('id').eq('id', id).eq('role', 'client').eq('lawyer_id', lawyer.id).maybeSingle()
  if (!target) return

  if (await resetUserMfa(id)) await audit(lawyer.id, 'mfa.reset', id)
  revalidatePath('/lawyer', 'layout')
}
