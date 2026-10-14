import Card from '@/components/Card'
import InvoiceTable from '@/components/InvoiceTable'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import { requireRole } from '@/lib/auth'
import { getNames } from '@/lib/data'
import { formatTotals, sumByCurrency } from '@/lib/format'
import { cumulativeWeekly, weekly } from '@/lib/series'
import { createClient } from '@/lib/supabase/server'
import type { InvoiceRow } from '@/lib/types'

export default async function ClientInvoicesPage() {
  const me = await requireRole('client')
  const supabase = await createClient()
  const { data } = await supabase.from('invoices').select('*').eq('client_id', me.id).order('created_at', { ascending: false })
  const invoices = (data ?? []) as InvoiceRow[]
  const names = await getNames(supabase, invoices.map((i) => i.lawyer_id))
  const due = invoices.filter((i) => i.status === 'sent')
  const paid = invoices.filter((i) => i.status === 'paid')

  return (
    <>
      <PageHeader title="Invoices" description="Your billing history. Contact your lawyer for payment arrangements." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          label="Balance due" value={formatTotals(sumByCurrency(due))} hint={`${due.length} invoice(s)`}
          tone={due.length ? 'warn' : 'default'} series={weekly(due.map((i) => i.issued_on))} caption="Issued · 8 wks"
        />
        <StatCard
          label="Total paid" value={formatTotals(sumByCurrency(paid))} tone="good"
          series={cumulativeWeekly(paid.map((i) => i.paid_on))} caption="Running total"
        />
      </div>
      <div className="mt-6">
        <Card padded={false}>
          <InvoiceTable invoices={invoices} names={names} role="client" basePath="/client/invoices" />
        </Card>
      </div>
    </>
  )
}
