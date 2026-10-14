import { notFound } from 'next/navigation'
import InvoiceDocument from '@/components/InvoiceDocument'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import PrintButton from '@/components/PrintButton'
import { secondaryBtnCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { getNames } from '@/lib/data'
import { isUuid } from '@/lib/form'
import { createClient } from '@/lib/supabase/server'
import type { InvoiceRow } from '@/lib/types'

export default async function LawyerInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole('lawyer')
  const { id } = await params
  if (!isUuid(id)) notFound()

  const supabase = await createClient()
  const { data } = await supabase.from('invoices').select('*').eq('id', id).eq('lawyer_id', me.id).maybeSingle()
  if (!data) notFound()
  const invoice = data as InvoiceRow

  const names = await getNames(supabase, [invoice.client_id])
  const { data: c } = invoice.case_id
    ? await supabase.from('cases').select('title').eq('id', invoice.case_id).maybeSingle()
    : { data: null }
  const client = names[invoice.client_id]

  return (
    <>
      <div className="print:hidden">
        <PageHeader title={invoice.number} back={{ href: '/lawyer/billing', label: 'All invoices' }} actions={
            <>
              {invoice.status === 'draft' && <Link href={`/lawyer/billing/${invoice.id}/edit`} className={secondaryBtnCls}>Edit draft</Link>}
              <PrintButton />
            </>
          } />
      </div>
      <InvoiceDocument
        invoice={invoice}
        from={{ name: me.full_name ?? me.email, email: me.email, extra: me.firm_name }}
        to={{ name: client?.full_name ?? client?.email ?? 'Client', email: client?.email ?? '' }}
        caseTitle={(c as { title: string } | null)?.title}
      />
    </>
  )
}
