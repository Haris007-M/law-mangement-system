'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { allow } from '@/lib/rate-limit'
import { audit } from '@/lib/audit'
import { getStr, isUuid } from '@/lib/form'
import { safeNext } from '@/lib/redirect'
import { BRAND } from '@/lib/brand'
import { ROLE_HOME, type ActionState } from '@/lib/types'

const TOO_MANY = 'Too many attempts. Please wait a few minutes and try again.'
const cleanCode = (fd: FormData) => getStr(fd, 'code', 12).replace(/\s/g, '')

export type EnrollStart = { error?: string; factorId?: string; qr?: string; secret?: string }

// Step 1 of turning 2FA on: create a pending authenticator factor and return its QR code.
export async function beginMfaEnroll(): Promise<EnrollStart> {
  const me = await requireUser()
  if (!(await allow(`mfa-enroll:${me.id}`, 10, 3600))) return { error: TOO_MANY }

  const supabase = await createClient()
  const { data: list } = await supabase.auth.mfa.listFactors()
  if ((list?.totp ?? []).length > 0) return { error: 'Two-factor authentication is already on.' }

  // clear half-finished set-ups so the new one never collides with them
  for (const f of list?.all ?? []) {
    if (f.factor_type === 'totp' && f.status === 'unverified') {
      await supabase.auth.mfa.unenroll({ factorId: f.id })
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `${BRAND.name} ${crypto.randomUUID().slice(0, 8)}`,
  })
  if (error || !data) return { error: error?.message ?? 'Could not start the set-up.' }
  return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret }
}

// Step 2: the person types the first code from their app to prove it works.
export async function confirmMfaEnroll(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser()
  const factorId = getStr(fd, 'factor_id', 60)
  const code = cleanCode(fd)
  if (!isUuid(factorId)) return { error: 'Please start the set-up again.' }
  if (!/^\d{6}$/.test(code)) return { error: 'Enter the 6-digit code shown in your app.' }
  if (!(await allow(`mfa:${me.id}`, 8, 900))) return { error: TOO_MANY }

  const supabase = await createClient()
  const { data: ch, error: chError } = await supabase.auth.mfa.challenge({ factorId })
  if (chError || !ch) return { error: chError?.message ?? 'Could not verify the code.' }

  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code })
  if (error) return { error: 'That code is not correct. Check the code and your phone clock, then try again.' }

  await createAdminClient().from('profiles').update({ mfa_enabled: true }).eq('id', me.id)
  await audit(me.id, 'mfa.enabled', me.id)
  revalidatePath(ROLE_HOME[me.role], 'layout')
  return { success: 'Two-factor authentication is now on.' }
}

// Turning it off needs a valid code too, so a borrowed, unlocked laptop cannot disable it.
export async function disableMfa(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser()
  const code = cleanCode(fd)
  if (!/^\d{6}$/.test(code)) return { error: 'Enter the 6-digit code shown in your app.' }
  if (!(await allow(`mfa:${me.id}`, 8, 900))) return { error: TOO_MANY }

  const supabase = await createClient()
  const { data: list } = await supabase.auth.mfa.listFactors()
  const factor = list?.totp?.[0]
  if (!factor) return { error: 'Two-factor authentication is not on.' }

  const { data: ch, error: chError } = await supabase.auth.mfa.challenge({ factorId: factor.id })
  if (chError || !ch) return { error: chError?.message ?? 'Could not verify the code.' }
  const { error: vError } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: ch.id, code })
  if (vError) return { error: 'That code is not correct.' }

  const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
  if (error) return { error: error.message }

  await createAdminClient().from('profiles').update({ mfa_enabled: false }).eq('id', me.id)
  await audit(me.id, 'mfa.disabled', me.id)
  revalidatePath(ROLE_HOME[me.role], 'layout')
  return { success: 'Two-factor authentication is now off.' }
}

// Used on /login/verify right after the password step.
export async function verifyLoginMfa(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const code = cleanCode(fd)
  if (!/^\d{6}$/.test(code)) return { error: 'Enter the 6-digit code shown in your app.' }
  if (!(await allow(`mfa:${user.id}`, 8, 900))) return { error: TOO_MANY }

  const { data: list } = await supabase.auth.mfa.listFactors()
  const factor = list?.totp?.[0]
  if (!factor) redirect('/')

  const { data: ch, error: chError } = await supabase.auth.mfa.challenge({ factorId: factor.id })
  if (chError || !ch) return { error: 'Could not verify the code. Please try again.' }

  const { error } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: ch.id, code })
  if (error) return { error: 'That code is not correct.' }

  redirect(safeNext(getStr(fd, 'next', 100), '/')) // '/' sends them to their dashboard
}
