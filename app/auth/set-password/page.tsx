import { redirect } from 'next/navigation'
import AuthCard from '@/components/AuthCard'
import SetPasswordForm from '@/components/SetPasswordForm'
import { createClient } from '@/lib/supabase/server'

// Reached from invite and password-reset emails (via /auth/confirm).
export default async function SetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?error=invalid_link')

  return (
    <AuthCard title="Set your password" subtitle={user.email}>
      <SetPasswordForm />
    </AuthCard>
  )
}
