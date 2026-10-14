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

export async function inviteLawyer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireRole('super_admin')

  const person = readPerson(formData)
  if (!person.ok) return { error: person.error, fields: person.fields }
  const fields = { email: person.email, full_name: person.fullName }

  if (!(await allow(`invite:${me.id}`, 30, 3600))) {
    return { error: 'Too many invitations in the last hour. Try again later.', fields }
  }

  const result = await createAccount({
    email: person.email,
    fullName: person.fullName,
    role: 'lawyer',
    invitedBy: me.full_name ?? 'The administrator',
  })

  if (result.ok) {
    await audit(me.id, 'lawyer.created', result.userId, { email: person.email })
    revalidatePath('/admin', 'layout')
  }
  return createResultToState(result, person.email, fields, 'Lawyer')
}

export async function resendLawyerInvite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireRole('super_admin')
  const id = String(formData.get('id') ?? '')
  if (!(await allow(`invite:${me.id}`, 30, 3600))) return { error: 'Too many requests. Try again later.' }

  const res = await reissueInvite(id, { role: 'lawyer' }, me.full_name ?? 'The administrator')
  if (res?.success || res?.link) await audit(me.id, 'invite.resent', id)
  return res
}

export async function setLawyerActive(formData: FormData) {
  const me = await requireRole('super_admin')

  const id = String(formData.get('id') ?? '')
  const active = formData.get('active') === 'true'
  if (!id) return

  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .update({ is_active: active })
    .eq('id', id)
    .eq('role', 'lawyer')
    .select('id')
  if (data?.length) await audit(me.id, active ? 'lawyer.reactivated' : 'lawyer.suspended', id)

  revalidatePath('/admin', 'layout')
}

// Lost phone: remove a lawyer's authenticator so they can sign in with password and set it up again.
export async function resetLawyerTwoFactor(formData: FormData) {
  const me = await requireRole('super_admin')
  const id = String(formData.get('id') ?? '')
  if (!isUuid(id)) return

  const { data: target } = await createAdminClient().from('profiles').select('id').eq('id', id).eq('role', 'lawyer').maybeSingle()
  if (!target) return

  if (await resetUserMfa(id)) await audit(me.id, 'mfa.reset', id)
  revalidatePath('/admin', 'layout')
}
