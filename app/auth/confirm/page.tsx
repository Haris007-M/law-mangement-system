import { redirect } from 'next/navigation'
import AuthCard from '@/components/AuthCard'
import { confirmToken } from '@/app/actions/auth'
import { buttonCls } from '@/components/ui'
import { BRAND } from '@/lib/brand'
import { createClient } from '@/lib/supabase/server'

// Landing page for invite / setup / reset links that carry a token_hash.
// The token is only verified when the person clicks the button.
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>
}) {
  const { token_hash, type, next } = await searchParams
  if (!token_hash || !type) redirect('/login?error=invalid_link')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <AuthCard title={`Welcome to ${BRAND.name}`} subtitle="Continue to choose your password.">
      {user && (
        <p role="alert" className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This browser is signed in as {user.email}. Continuing will sign that account out and
          switch to the account this link belongs to. If you are just testing, use a private window.
        </p>
      )}
      <form action={confirmToken}>
        <input type="hidden" name="token_hash" value={token_hash} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="next" value={next ?? '/auth/set-password'} />
        <button type="submit" className={`${buttonCls} w-full`}>
          Continue
        </button>
      </form>
    </AuthCard>
  )
}
