import AppShell from '@/components/AppShell'
import { requireRole } from '@/lib/auth'
import { CLIENT_NAV } from '@/lib/nav'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole('client')
  return <AppShell profile={me} nav={CLIENT_NAV}>{children}</AppShell>
}
