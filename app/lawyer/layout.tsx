import AppShell from '@/components/AppShell'
import { requireRole } from '@/lib/auth'
import { LAWYER_NAV } from '@/lib/nav'

export default async function LawyerLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole('lawyer')
  return <AppShell profile={me} nav={LAWYER_NAV}>{children}</AppShell>
}
