import Link from 'next/link'
import Card from '@/components/Card'
import DocumentList from '@/components/DocumentList'
import EmptyState from '@/components/EmptyState'
import EventList from '@/components/EventList'
import DashboardBanner, { todayLabel } from '@/components/DashboardBanner'
import StatCard from '@/components/StatCard'
import { CaseStatusBadge } from '@/components/Badge'
import { buttonCls, linkCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { getNames } from '@/lib/data'
import { formatTotals, sumByCurrency } from '@/lib/format'
import { cumulativeWeekly, nextDays, weekly } from '@/lib/series'
import { createClient } from '@/lib/supabase/server'
import type { CaseRow, DocumentRow, EventRow, InvoiceRow, Profile } from '@/lib/types'

export default async function ClientDashboard() {
  const me = await requireRole('client')
  const supabase = await createClient()

  const [casesRes, eventsRes, invRes, docsRes, lawyerRes] = await Promise.all([
    supabase.from('cases').select('*').eq('client_id', me.id).order('updated_at', { ascending: false }),
    supabase.from('events').select('*').gte('starts_at', new Date().toISOString()).order('starts_at', { ascending: true }).limit(60),
    supabase.from('invoices').select('*').eq('client_id', me.id).order('created_at', { ascending: false }).limit(200),
    supabase.from('documents').select('*').order('created_at', { ascending: false }).limit(5),
    me.lawyer_id ? supabase.from('profiles').select('*').eq('id', me.lawyer_id).maybeSingle() : Promise.resolve({ data: null }),
  ])

  const cases = (casesRes.data ?? []) as CaseRow[]
  const allEvents = (eventsRes.data ?? []) as EventRow[]
  const events = allEvents.slice(0, 5)
  const invoices = (invRes.data ?? []) as InvoiceRow[]
  const due = invoices.filter((i) => i.status === 'sent')
  const docs = (docsRes.data ?? []) as DocumentRow[]
  const lawyer = lawyerRes.data as Profile | null
  const active = cases.filter((c) => c.status !== 'closed')
  const caseTitles = Object.fromEntries(cases.map((c) => [c.id, c.title]))
  const names = await getNames(supabase, docs.map((d) => d.uploaded_by))

  return (
    <>
      <DashboardBanner
        image="/images/banner-client.jpg"
        eyebrow={todayLabel()}
        title={`Welcome, ${me.full_name?.split(' ')[0] ?? 'there'}`}
        subtitle="Follow your cases, share documents and stay in touch with your lawyer."
      >
        <Link href="/client/cases" className={buttonCls}>View my cases</Link>
      </DashboardBanner>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="Active cases" value={active.length} hint={`${cases.length} in total`}
          series={cumulativeWeekly(cases.map((c) => c.created_at))} caption="Cases over time"
        />
        <StatCard
          label="Upcoming appointments" value={allEvents.length}
          series={nextDays(allEvents.map((e) => e.starts_at), 14)} chart="bars" caption="Next 14 days"
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label="Balance due" value={formatTotals(sumByCurrency(due))} hint={`${due.length} invoice(s)`}
            tone={due.length ? 'warn' : 'default'} series={weekly(invoices.map((i) => i.issued_on))} caption="Invoices · 8 wks"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Your cases" padded={false} action={<Link href="/client/cases" className={linkCls}>View all</Link>}>
            {cases.length === 0 ? (
              <EmptyState title="No cases yet" hint="Your lawyer will open a case for you." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {cases.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="min-w-0">
                      <Link href={`/client/cases/${c.id}`} className={`${linkCls} block truncate`}>{c.title}</Link>
                      <p className="text-xs text-slate-500">{c.case_number} · {c.case_type}</p>
                    </div>
                    <CaseStatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Recent documents" padded={false} action={<Link href="/client/documents" className={linkCls}>All documents</Link>}>
            <DocumentList docs={docs} caseTitles={caseTitles} names={names} role="client" meId={me.id} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Your lawyer">
            {lawyer ? (
              <div className="text-sm">
                <p className="font-medium text-slate-900">{lawyer.full_name}</p>
                {lawyer.firm_name && <p className="text-slate-600">{lawyer.firm_name}</p>}
                <p className="mt-2 text-slate-600">{lawyer.email}</p>
                {lawyer.phone && <p className="text-slate-600">{lawyer.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Not available.</p>
            )}
          </Card>
          <Card title="Next appointments" padded={false} action={<Link href="/client/appointments" className={linkCls}>All</Link>}>
            <EventList events={events} caseTitles={caseTitles} emptyHint="Nothing scheduled right now." />
          </Card>
        </div>
      </div>
    </>
  )
}
