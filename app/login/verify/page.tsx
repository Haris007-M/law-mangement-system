import { redirect } from 'next/navigation'
import AuthCard from '@/components/AuthCard'
import MfaLoginForm from '@/components/MfaLoginForm'
import { createClient } from '@/lib/supabase/server'

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase.rpc('my_access').maybeSingle()
  const access = data as { my_mfa_ok: boolean } | null
  if (access?.my_mfa_ok) redirect('/') // nothing to verify

  return (
    <AuthCard title="Two-factor verification" subtitle="Enter the 6-digit code from your authenticator app.">
      <MfaLoginForm next={next === '/auth/set-password' ? next : undefined} />
    </AuthCard>
  )
}
