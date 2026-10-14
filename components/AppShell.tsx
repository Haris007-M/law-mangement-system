import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import Sidebar from './Sidebar'
import TableLabels from './TableLabels'
import { ROLE_HOME, ROLE_LABEL, type Profile } from '@/lib/types'
import type { NavItem } from '@/lib/nav'

export default function AppShell({
  profile,
  nav,
  children,
}: {
  profile: Profile
  nav: NavItem[]
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-canvas">
      <Sidebar
        items={nav}
        name={profile.full_name ?? profile.email}
        email={profile.email}
        roleLabel={ROLE_LABEL[profile.role]}
      />
      <TableLabels />
      <main className="pb-[calc(4.5rem_+_env(safe-area-inset-bottom))] pt-[calc(3.5rem_+_env(safe-area-inset-top))] lg:pb-0 lg:pl-64 lg:pt-0 print:pb-0 print:pl-0 print:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-10">
          {profile.role !== 'client' && !profile.mfa_enabled && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-700 print:hidden">
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                Protect client confidentiality: turn on two-factor authentication for your account.
              </span>
              <Link href={`${ROLE_HOME[profile.role]}/settings`} className="font-semibold underline underline-offset-2">Set it up</Link>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
