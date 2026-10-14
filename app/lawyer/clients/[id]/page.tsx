import Link from 'next/link'
import { notFound } from 'next/navigation'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import InvoiceTable from '@/components/InvoiceTable'
import PageHeader from '@/components/PageHeader'
import { AccountStatusBadge, CaseStatusBadge } from '@/components/Badge'
import { buttonCls, linkCls, tdCls, thCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { isUuid } from '@/lib/form'
import { formatDate } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import type { CaseRow, InvoiceRow, Profile } from '@/lib/types'

export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole('lawyer')
  const { id } = await params
  if (!isUuid(id)) notFound()

  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*')
    .eq('id', id).eq('role', 'client').eq('lawyer_id', me.id).maybeSingle()
  if (!data) notFound()
  const client = data as Profile

  const [casesRes, invRes] = await Promise.all([
    supabase.from('cases').select('*').eq('lawyer_id', me.id).eq('client_id', id).order('updated_at', { ascending: false }),
    supabase.from('invoices').select('*').eq('lawyer_id', me.id).eq('client_id', id).order('created_at', { ascending: false }),
  ])
  const cases = (casesRes.data ?? []) as CaseRow[]
  const invoices = (invRes.data ?? []) as InvoiceRow[]
  const names = { [me.id]: { full_name: me.full_name, email: me.email }, [client.id]: { full_name: client.full_name, email: client.email } }
  const caseTitles = Object.fromEntries(cases.map((c) => [c.id, c.title]))

  return (
    <>
      <PageHeader
        title={client.full_name ?? client.email}
        description={client.email}
        back={{ href: '/lawyer/clients', label: 'All clients' }}
        actions={<Link href={`/lawyer/cases/new?client=${client.id}`} className={buttonCls}>New case</Link>}
      />
      <div className="grid gap-6">
        <Card title="Contact">
          <dl className="grid gap-4 text-sm sm:grid-cols-4">
            <div><dt className="text-slate-500">Email</dt><dd className="mt-0.5 text-slate-900">{client.email}</dd></div>
            <div><dt className="text-slate-500">Phone</dt><dd className="mt-0.5 text-slate-900">{client.phone || '—'}</dd></div>
            <div><dt className="text-slate-500">Client since</dt><dd className="mt-0.5 text-slate-900">{formatDate(client.created_at)}</dd></div>
            <div><dt className="text-slate-500">Account</dt><dd className="mt-0.5"><AccountStatusBadge isActive={client.is_active} passwordSetAt={client.password_set_at} /></dd></div>
          </dl>
        </Card>

        <Card title={`Cases (${cases.length})`} padded={false}>
          {cases.length === 0 ? (
            <EmptyState title="No cases for this client yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr><th className={thCls}>Case</th><th className={thCls}>Type</th><th className={thCls}>Opened</th><th className={thCls}>Status</th></tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100">
                      <td className={tdCls}>
                        <Link href={`/lawyer/cases/${c.id}`} className={linkCls}>{c.title}</Link>
                        <p className="text-xs text-slate-500">{c.case_number}</p>
                      </td>
                      <td className={tdCls}>{c.case_type}</td>
                      <td className={tdCls}>{formatDate(c.opened_on)}</td>
                      <td className={tdCls}><CaseStatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Invoices" padded={false}>
          <InvoiceTable invoices={invoices} names={names} caseTitles={caseTitles} role="lawyer" basePath="/lawyer/billing" />
        </Card>
      </div>
    </>
  )
}
