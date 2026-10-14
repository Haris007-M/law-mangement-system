import PageHeader from '@/components/PageHeader'
import SettingsPanel from '@/components/SettingsPanel'
import { requireRole } from '@/lib/auth'

export default async function AdminSettingsPage() {
  const me = await requireRole('super_admin')
  return (
    <>
      <PageHeader title="Settings" description="Your profile and password." />
      <SettingsPanel profile={me} />
    </>
  )
}
