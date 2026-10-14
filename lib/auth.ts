import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROLE_HOME, type Profile, type UserRole } from '@/lib/types'

// cache(): layout + page + action in the same request share one lookup.
export const getSessionProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return (data as Profile) ?? null
})

// Any signed-in, active account (use in actions that every role may call).
export async function requireUser(): Promise<Profile> {
  const profile = await getSessionProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()
  const { data } = await supabase.rpc('my_access').maybeSingle()
  const access = data as { my_active: boolean; my_mfa_ok: boolean } | null
  if (!access) {
    redirect('/login')
  } else {
    if (!access.my_mfa_ok) redirect('/login/verify') // password ok, 2FA code still needed
    if (!access.my_active) redirect('/login?error=inactive')
  }

  return profile
}

// Call at the top of every protected page AND every server action
// (layouts alone are NOT enough: they do not re-run on client-side navigation).
export async function requireRole(role: UserRole): Promise<Profile> {
  const profile = await requireUser()
  if (profile.role !== role) redirect(ROLE_HOME[profile.role])
  return profile
}
