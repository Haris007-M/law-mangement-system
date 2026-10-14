import PageHeader from '@/components/PageHeader'
import SettingsPanel from '@/components/SettingsPanel'
import { requireRole } from '@/lib/auth'

export default async function LawyerSettingsPage() {
  const me = await requireRole('lawyer')
  return (
    <>
      <PageHeader title="Settings" description="Your profile, firm name (shown on invoices) and password." />
      <SettingsPanel profile={me} />
    </>
  )
}
