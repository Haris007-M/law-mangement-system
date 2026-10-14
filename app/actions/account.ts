'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { allow } from '@/lib/rate-limit'
import { audit } from '@/lib/audit'
import { getStr } from '@/lib/form'
import { validatePassword } from '@/lib/password'
import { ROLE_HOME, type ActionState } from '@/lib/types'

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireUser()
  const fullName = getStr(formData, 'full_name', 120)
  const phone = getStr(formData, 'phone', 40)
  if (!fullName) return { error: 'Enter your name.' }

  // Only these columns can be changed, and only on your own row.
  const update: Record<string, string | boolean | null> = {
    full_name: fullName,
    phone: phone || null,
    notify_email: formData.get('notify_email') === 'on',
  }
  if (me.role === 'lawyer') update.firm_name = getStr(formData, 'firm_name', 160) || null

  const { error } = await createAdminClient().from('profiles').update(update).eq('id', me.id)
  if (error) {
    console.error('updateProfile failed:', error.message)
    return { error: 'Could not save your profile.' }
  }

  revalidatePath(ROLE_HOME[me.role], 'layout')
  return { success: 'Profile saved.' }
}

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireUser()
  const current = String(formData.get('current') ?? '')
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (!(await allow(`pwchange:${me.id}`, 5, 900))) {
    return { error: 'Too many attempts. Please wait a few minutes and try again.' }
  }
  if (!current) return { error: 'Enter your current password.' }
  const problem = validatePassword(password)
  if (problem) return { error: problem }
  if (password !== confirm) return { error: 'Passwords do not match.' }
  if (password === current) return { error: 'Choose a different password from the current one.' }

  const supabase = await createClient()
  const { error: verifyError } = await supabase.auth.signInWithPassword({ email: me.email, password: current })
  if (verifyError) return { error: 'Your current password is incorrect.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  await supabase.auth.signOut({ scope: 'others' })
  await audit(me.id, 'password.changed', me.id)
  return { success: 'Password updated. Other devices have been signed out.' }
}
