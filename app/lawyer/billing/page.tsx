import ActionForm from '@/components/ActionForm'
import Card from '@/components/Card'
import InvoiceTable from '@/components/InvoiceTable'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import { Field, Select, TextArea } from '@/components/Field'
import { requireRole } from '@/lib/auth'
import { CURRENCIES } from '@/lib/constants'
import { getNames } from '@/lib/data'
import { isUuid } from '@/lib/form'
import { formatTotals, sumByCurrency } from '@/lib/format'
import { cumulativeWeekly, weekly } from '@/lib/series'
import { createClient } from '@/lib/supabase/server'
import type { CaseRow, InvoiceRow } from '@/lib/types'
import { createInvoice } from '../practice-actions'

const paid_all_dates = (rows: InvoiceRow[]) => rows.map((i) => i.paid_on)

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ case?: string }> }) {
  const me = await requireRole('lawyer')
  const { case: caseParam = '' } = await searchParams
  const supabase = await createClient()

  const [invRes, clientRes, caseRes] = await Promise.all([
    supabase.from('invoices').select('*').eq('lawyer_id', me.id).order('created_at', { ascending: false }).limit(300),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'client').eq('lawyer_id', me.id).eq('is_active', true).order('full_name'),
    supabase.from('cases').select('id, title, case_number, client_id').eq('lawyer_id', me.id).order('title'),
  ])
  const invoices = (invRes.data ?? []) as InvoiceRow[]
  const clients = (clientRes.data ?? []) as { id: string; full_name: string | null; email: string }[]
  const cases = (caseRes.data ?? []) as Pick<CaseRow, 'id' | 'title' | 'case_number' | 'client_id'>[]
  const names = await getNames(supabase, [...invoices.map((i) => i.client_id), me.id])
  const caseTitles = Object.fromEntries(cases.map((c) => [c.id, c.title]))
  const clientLabel = Object.fromEntries(clients.map((c) => [c.id, c.full_name ?? c.email]))

  const preCase = isUuid(caseParam) ? cases.find((c) => c.id === caseParam) : undefined
  const month = new Date().toISOString().slice(0, 7)
  const outstanding = invoices.filter((i) => i.status === 'sent')
  const paidMonth = invoices.filter((i) => i.status === 'paid' && i.paid_on?.startsWith(month))
  const paidAll = invoices.filter((i) => i.status === 'paid')

  return (
    <>
      <PageHeader title="Billing" description="Create invoices, track payments and share them with your clients." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="Awaiting payment" value={formatTotals(sumByCurrency(outstanding))} hint={`${outstanding.length} invoice(s)`}
          tone={outstanding.length ? 'warn' : 'default'} series={weekly(outstanding.map((i) => i.issued_on))} caption="Sent · 8 wks"
        />
        <StatCard
          label="Paid this month" value={formatTotals(sumByCurrency(paidMonth))} tone="good"
          series={weekly(paid_all_dates(paidAll))} caption="Paid · 8 wks"
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label="Paid all time" value={formatTotals(sumByCurrency(paidAll))}
            series={cumulativeWeekly(paid_all_dates(paidAll))} caption="Running total"
          />
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <Card title="Create an invoice">
          {clients.length === 0 ? (
            <p className="text-sm text-slate-600">Add a client first, then you can invoice them.</p>
          ) : (
            <ActionForm action={createInvoice} submitLabel="Create invoice" pendingLabel="Creating...">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Client" name="client_id" required emptyLabel="Select a client"
                  defaultValue={preCase?.client_id ?? ''}
                  options={clients.map((c) => ({ value: c.id, label: c.full_name ? `${c.full_name} (${c.email})` : c.email }))}
                />
                <Select
                  label="Case (optional)" name="case_id" emptyLabel="Not linked to a case"
                  defaultValue={preCase?.id ?? ''}
                  options={cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title} · ${clientLabel[c.client_id] ?? ''}` }))}
                />
                <Field label="Amount" name="amount" required placeholder="0.00" />
                <Select label="Currency" name="currency" defaultValue="USD" options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
                <Field label="Due date" name="due_on" type="date" />
                <Select label="Save as" name="status" defaultValue="draft" options={[{ value: 'draft', label: 'Draft (hidden from client)' }, { value: 'sent', label: 'Sent (client can see it)' }]} />
              </div>
              <TextArea label="Description" name="description" rows={3} maxLength={1000} placeholder="What this invoice is for" />
            </ActionForm>
          )}
        </Card>

        <Card title={`Invoices (${invoices.length})`} padded={false}>
          <InvoiceTable invoices={invoices} names={names} caseTitles={caseTitles} role="lawyer" basePath="/lawyer/billing" />
        </Card>
      </div>
    </>
  )
}
