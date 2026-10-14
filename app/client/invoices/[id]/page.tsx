import { notFound } from 'next/navigation'
import InvoiceDocument from '@/components/InvoiceDocument'
import PageHeader from '@/components/PageHeader'
import PrintButton from '@/components/PrintButton'
import { requireRole } from '@/lib/auth'
import { isUuid } from '@/lib/form'
import { createClient } from '@/lib/supabase/server'
import type { InvoiceRow, Profile } from '@/lib/types'

export default async function ClientInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole('client')
  const { id } = await params
  if (!isUuid(id)) notFound()

  const supabase = await createClient()
  // RLS already hides drafts and other people's invoices; the filter is belt and braces.
  const { data } = await supabase.from('invoices').select('*').eq('id', id).eq('client_id', me.id).maybeSingle()
  if (!data) notFound()
  const invoice = data as InvoiceRow

  const { data: l } = await supabase.from('profiles').select('*').eq('id', invoice.lawyer_id).maybeSingle()
  const lawyer = l as Profile | null
  const { data: c } = invoice.case_id
    ? await supabase.from('cases').select('title').eq('id', invoice.case_id).maybeSingle()
    : { data: null }

  return (
    <>
      <div className="print:hidden">
        <PageHeader title={invoice.number} back={{ href: '/client/invoices', label: 'All invoices' }} actions={<PrintButton />} />
      </div>
      <InvoiceDocument
        invoice={invoice}
        from={{ name: lawyer?.full_name ?? 'Your lawyer', email: lawyer?.email ?? '', extra: lawyer?.firm_name }}
        to={{ name: me.full_name ?? me.email, email: me.email }}
        caseTitle={(c as { title: string } | null)?.title}
      />
    </>
  )
}
