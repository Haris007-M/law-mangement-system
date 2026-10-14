import Link from 'next/link'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import EventList from '@/components/EventList'
import DashboardBanner, { todayLabel } from '@/components/DashboardBanner'
import StatCard from '@/components/StatCard'
import { CaseStatusBadge } from '@/components/Badge'
import { buttonCls, ghostOnDarkBtnCls, linkCls, tdCls, thCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { CASE_STATUSES, CASE_STATUS_LABEL } from '@/lib/constants'
import { getNames, nameOf } from '@/lib/data'
import { formatDate, formatTotals, sumByCurrency, todayISO } from '@/lib/format'
import { cumulativeWeekly, nextDays, total, weekly } from '@/lib/series'
import { createClient } from '@/lib/supabase/server'
import type { CaseRow, EventRow, InvoiceRow, TaskRow } from '@/lib/types'

export default async function LawyerDashboard() {
  const me = await requireRole('lawyer')
  const supabase = await createClient()
  const today = todayISO()

  const [casesRes, clientsRes, tasksRes, eventsRes, invoicesRes] = await Promise.all([
    supabase.from('cases').select('*').eq('lawyer_id', me.id).order('updated_at', { ascending: false }).limit(500),
    supabase.from('profiles').select('id, created_at').eq('role', 'client').eq('lawyer_id', me.id).limit(1000),
    supabase.from('tasks').select('*').eq('lawyer_id', me.id).eq('done', false)
      .order('due_date', { ascending: true, nullsFirst: false }).limit(50),
    supabase.from('events').select('*').eq('lawyer_id', me.id).gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true }).limit(5),
    supabase.from('invoices').select('*').eq('lawyer_id', me.id).order('created_at', { ascending: false }).limit(300),
  ])

  const cases = (casesRes.data ?? []) as CaseRow[]
  const tasks = (tasksRes.data ?? []) as TaskRow[]
  const events = (eventsRes.data ?? []) as EventRow[]
  const invoices = (invoicesRes.data ?? []) as InvoiceRow[]
  const outstanding = invoices.filter((i) => i.status === 'sent')
  const clients = (clientsRes.data ?? []) as { id: string; created_at: string }[]

  // data behind the charts
  const newCases = weekly(cases.map((c) => c.created_at))
  const clientGrowth = cumulativeWeekly(clients.map((c) => c.created_at))
  const dueSoon = nextDays(tasks.map((t) => t.due_date), 7)
  const invoicesIssued = weekly(invoices.map((i) => i.issued_on))

  const openCases = cases.filter((c) => c.status !== 'closed')
  const overdue = tasks.filter((t) => t.due_date && t.due_date < today).length
  const statusCount = Object.fromEntries(CASE_STATUSES.map((s) => [s, cases.filter((c) => c.status === s).length]))
  const maxCount = Math.max(1, ...Object.values(statusCount))

  const recent = cases.slice(0, 5)
  const names = await getNames(supabase, recent.map((c) => c.client_id))
  const caseTitles = Object.fromEntries(cases.map((c) => [c.id, c.title]))

  return (
    <>
      <DashboardBanner
        image="/images/banner-lawyer.jpg"
        eyebrow={todayLabel()}
        title={`Good day, ${me.full_name?.split(' ')[0] ?? 'counsel'}`}
        subtitle="Here is what needs your attention."
      >
        <Link href="/lawyer/cases/new" className={buttonCls}>New case</Link>
        <Link href="/lawyer/clients" className={ghostOnDarkBtnCls}>Add client</Link>
      </DashboardBanner>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Open cases" value={openCases.length} hint={`${cases.length} in total`}
          series={newCases} caption="New cases · 8 wks"
        />
        <StatCard
          label="Clients" value={clients.length} hint={`${total(weekly(clients.map((c) => c.created_at)))} added in 8 wks`}
          series={clientGrowth} caption="Client growth"
        />
        <StatCard
          label="Open tasks" value={tasks.length} hint={overdue ? `${overdue} overdue` : 'Nothing overdue'}
          tone={overdue ? 'alert' : 'default'} series={dueSoon} chart="bars" caption="Due next 7 days"
        />
        <StatCard
          label="Awaiting payment" value={formatTotals(sumByCurrency(outstanding))} hint={`${outstanding.length} sent invoice(s)`}
          tone={outstanding.length ? 'warn' : 'default'} series={invoicesIssued} caption="Invoices · 8 wks"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Upcoming schedule" padded={false} action={<Link href="/lawyer/calendar" className={linkCls}>Calendar</Link>}>
          <EventList events={events} caseTitles={caseTitles} emptyHint="Add hearings and meetings from the calendar." />
        </Card>

        <Card title="Cases by status">
          {cases.length === 0 ? (
            <EmptyState title="No cases yet" hint="Create your first case to see the breakdown." />
          ) : (
            <div className="space-y-3">
              {CASE_STATUSES.map((s) => (
                <div key={s}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-700">{CASE_STATUS_LABEL[s]}</span>
                    <span className="font-medium text-slate-900">{statusCount[s]}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(statusCount[s] / maxCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Recent cases" padded={false} action={<Link href="/lawyer/cases" className={linkCls}>All cases</Link>}>
          {recent.length === 0 ? (
            <EmptyState title="No cases yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr><th className={thCls}>Case</th><th className={thCls}>Client</th><th className={thCls}>Status</th></tr>
                </thead>
                <tbody>
                  {recent.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100">
                      <td className={tdCls}>
                        <Link href={`/lawyer/cases/${c.id}`} className={linkCls}>{c.title}</Link>
                        <p className="text-xs text-slate-500">{c.case_number}</p>
                      </td>
                      <td className={tdCls}>{nameOf(names, c.client_id)}</td>
                      <td className={tdCls}><CaseStatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Tasks due soon" padded={false} action={<Link href="/lawyer/tasks" className={linkCls}>All tasks</Link>}>
          {tasks.length === 0 ? (
            <EmptyState title="All caught up" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {tasks.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center justify-between px-5 py-3">
                  <p className="truncate text-sm text-slate-900">{t.title}</p>
                  <span className={`ml-3 shrink-0 text-xs ${t.due_date && t.due_date < today ? 'font-medium text-alert-700' : 'text-slate-500'}`}>
                    {t.due_date ? formatDate(t.due_date) : 'No date'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
