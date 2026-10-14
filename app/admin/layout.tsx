import AppShell from '@/components/AppShell'
import { requireRole } from '@/lib/auth'
import { ADMIN_NAV } from '@/lib/nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole('super_admin')
  return <AppShell profile={me} nav={ADMIN_NAV}>{children}</AppShell>
}
