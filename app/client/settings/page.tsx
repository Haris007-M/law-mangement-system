import PageHeader from '@/components/PageHeader'
import SettingsPanel from '@/components/SettingsPanel'
import { requireRole } from '@/lib/auth'

export default async function ClientSettingsPage() {
  const me = await requireRole('client')
  return (
    <>
      <PageHeader title="Settings" description="Your contact details and password." />
      <SettingsPanel profile={me} />
    </>
  )
}
