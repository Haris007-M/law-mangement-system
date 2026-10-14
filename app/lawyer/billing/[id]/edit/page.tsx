import { notFound, redirect } from 'next/navigation'
import ActionForm from '@/components/ActionForm'
import Card from '@/components/Card'
import PageHeader from '@/components/PageHeader'
import { Field, Select, TextArea } from '@/components/Field'
import { labelCls, inputCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { CURRENCIES } from '@/lib/constants'
import { getNames, nameOf } from '@/lib/data'
import { isUuid } from '@/lib/form'
import { createClient } from '@/lib/supabase/server'
import type { InvoiceRow } from '@/lib/types'
import { updateInvoice } from '../../../practice-actions'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole('lawyer')
  const { id } = await params
  if (!isUuid(id)) notFound()

  const supabase = await createClient()
  const { data } = await supabase.from('invoices').select('*').eq('id', id).eq('lawyer_id', me.id).maybeSingle()
  if (!data) notFound()
  const invoice = data as InvoiceRow
  if (invoice.status !== 'draft') redirect(`/lawyer/billing/${id}`) // sent invoices are locked

  const [{ data: caseData }, names] = await Promise.all([
    supabase.from('cases').select('id, title, case_number').eq('lawyer_id', me.id).eq('client_id', invoice.client_id).order('title'),
    getNames(supabase, [invoice.client_id]),
  ])
  const cases = (caseData ?? []) as { id: string; title: string; case_number: string }[]

  return (
    <>
      <PageHeader
        title={`Edit ${invoice.number}`}
        description="Only draft invoices can be edited. Once sent, void it and create a new one to change amounts."
        back={{ href: `/lawyer/billing/${id}`, label: 'Back to invoice' }}
      />
      <Card>
        <ActionForm action={updateInvoice} submitLabel="Save invoice" pendingLabel="Saving..." resetOnSuccess={false}>
          <input type="hidden" name="id" value={invoice.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Client</label>
              <input value={nameOf(names, invoice.client_id)} disabled readOnly className={`${inputCls} bg-slate-50 text-slate-500`} />
            </div>
            <Select
              label="Case (optional)" name="case_id" emptyLabel="Not linked to a case" defaultValue={invoice.case_id ?? ''}
              options={cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title}` }))}
            />
            <Field label="Amount" name="amount" required defaultValue={(invoice.amount_cents / 100).toFixed(2)} />
            <Select label="Currency" name="currency" defaultValue={invoice.currency} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
            <Field label="Due date" name="due_on" type="date" defaultValue={invoice.due_on} />
          </div>
          <TextArea label="Description" name="description" rows={3} maxLength={1000} defaultValue={invoice.description} />
        </ActionForm>
      </Card>
    </>
  )
}
