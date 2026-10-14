import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROLE_HOME, type UserRole } from '@/lib/types'

// /api/cron is public to the proxy because the route checks its own secret
const PUBLIC_PATHS = ['/login', '/forgot-password', '/auth', '/terms', '/privacy', '/api/cron', '/manifest.webmanifest']
const ROLE_AREAS = ['/admin', '/lawyer', '/client']

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            })
          )
        },
      },
    }
  )

  // Always getUser() (validates the JWT with Supabase), never trust getSession() here.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  // '/' is the public landing page (signed-in users are redirected to their dashboard below)
  const isPublic = path === '/' || PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'))

  // Redirect while keeping any refreshed/cleared auth cookies.
  const redirectTo = (to: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone()
    url.pathname = to
    url.search = ''
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    const res = NextResponse.redirect(url)
    response.cookies.getAll().forEach((c) => res.cookies.set(c))
    return res
  }

  if (!user) return isPublic ? response : redirectTo('/login')

  const { data } = await supabase.rpc('my_access').maybeSingle()
  const access = data as { my_role: UserRole; my_active: boolean; my_mfa_ok: boolean } | null

  // No profile, or account suspended (lawyer unpaid, or client's lawyer unpaid)
  if (!access || !access.my_active) {
    await supabase.auth.signOut()
    return redirectTo('/login', { error: access ? 'inactive' : 'noprofile' })
  }

  // Password was correct but the authenticator-app code is still outstanding:
  // nothing except the 2FA page is reachable until it is entered.
  if (!access.my_mfa_ok) {
    if (path === '/login/verify') return response
    // keep the password-reset destination so the person still reaches the new-password form
    return redirectTo('/login/verify', path === '/auth/set-password' ? { next: path } : undefined)
  }

  const home = ROLE_HOME[access.my_role]

  if (path === '/' || path === '/login' || path === '/login/verify' || path === '/forgot-password') {
    return redirectTo(home)
  }

  const area = ROLE_AREAS.find((a) => path === a || path.startsWith(a + '/'))
  if (area && area !== home) return redirectTo(home)

  return response
}
