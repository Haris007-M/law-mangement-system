import { notFound } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import TabNav from '@/components/TabNav'
import { CaseStatusBadge } from '@/components/Badge'
import { requireRole } from '@/lib/auth'
import { getNames, nameOf } from '@/lib/data'
import { isUuid } from '@/lib/form'
import { createClient } from '@/lib/supabase/server'
import type { CaseRow } from '@/lib/types'
import {
  BillingTab, DocumentsTab, MessagesTab, NotesTab, OverviewTab, ScheduleTab, TasksTab,
} from './tabs'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'messages', label: 'Messages' },
  { key: 'documents', label: 'Documents' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'notes', label: 'Private notes' },
  { key: 'billing', label: 'Billing' },
]

export default async function CaseDetailPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const me = await requireRole('lawyer')
  const { id } = await params
  const { tab = 'overview' } = await searchParams
  if (!isUuid(id)) notFound()

  const supabase = await createClient()
  const { data } = await supabase.from('cases').select('*').eq('id', id).eq('lawyer_id', me.id).maybeSingle()
  if (!data) notFound()
  const c = data as CaseRow

  const names = await getNames(supabase, [c.client_id])
  const clientName = nameOf(names, c.client_id)
  const active = TABS.some((t) => t.key === tab) ? tab : 'overview'
  const props = { c, me, clientName }

  return (
    <>
      <PageHeader
        title={c.title}
        description={`${c.case_number} · ${clientName}`}
        back={{ href: '/lawyer/cases', label: 'All cases' }}
        actions={<CaseStatusBadge status={c.status} />}
      />
      <TabNav base={`/lawyer/cases/${c.id}`} tabs={TABS} active={active} />
      <div className="mt-6">
        {active === 'overview' && <OverviewTab {...props} />}
        {active === 'messages' && <MessagesTab {...props} />}
        {active === 'documents' && <DocumentsTab {...props} />}
        {active === 'tasks' && <TasksTab {...props} />}
        {active === 'schedule' && <ScheduleTab {...props} />}
        {active === 'notes' && <NotesTab {...props} />}
        {active === 'billing' && <BillingTab {...props} />}
      </div>
    </>
  )
}
