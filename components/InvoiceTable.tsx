import Link from 'next/link'
import { deleteInvoice, setInvoiceStatus } from '@/app/lawyer/practice-actions'
import { formatDate, formatMoney } from '@/lib/format'
import { nameOf, type NameMap } from '@/lib/data'
import type { InvoiceRow } from '@/lib/types'
import { InvoiceStatusBadge } from './Badge'
import ConfirmButton from './ConfirmButton'
import EmptyState from './EmptyState'
import { dangerLinkCls, linkCls, tdCls, thCls } from './ui'

function StatusForm({ id, status, label, danger }: { id: string; status: string; label: string; danger?: boolean }) {
  return (
    <form action={setInvoiceStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      {danger ? (
        <ConfirmButton message="Void this invoice? This cannot be undone." className={dangerLinkCls}>{label}</ConfirmButton>
      ) : (
        <button type="submit" className={linkCls}>{label}</button>
      )}
    </form>
  )
}

export default function InvoiceTable({
  invoices, names, caseTitles = {}, role, basePath,
}: {
  invoices: InvoiceRow[]
  names: NameMap
  caseTitles?: Record<string, string>
  role: 'lawyer' | 'client'
  basePath: string
}) {
  if (invoices.length === 0) {
    return <EmptyState title="No invoices yet" hint={role === 'lawyer' ? 'Create your first invoice above.' : 'Invoices from your lawyer will appear here.'} />
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className={thCls}>Invoice</th>
            <th className={thCls}>{role === 'lawyer' ? 'Client' : 'From'}</th>
            <th className={thCls}>Amount</th>
            <th className={thCls}>Status</th>
            <th className={thCls}>Due</th>
            <th className={thCls} />
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => (
            <tr key={i.id} className="border-t border-slate-100">
              <td className={tdCls}>
                <Link href={`${basePath}/${i.id}`} className={linkCls}>{i.number}</Link>
                <p className="text-xs text-slate-500">{i.case_id && caseTitles[i.case_id] ? caseTitles[i.case_id] : formatDate(i.issued_on)}</p>
              </td>
              <td className={tdCls}>{nameOf(names, role === 'lawyer' ? i.client_id : i.lawyer_id)}</td>
              <td className={`${tdCls} font-medium text-slate-900`}>{formatMoney(i.amount_cents, i.currency)}</td>
              <td className={tdCls}><InvoiceStatusBadge status={i.status} /></td>
              <td className={tdCls}>{i.status === 'paid' ? `Paid ${formatDate(i.paid_on)}` : formatDate(i.due_on)}</td>
              <td className={`${tdCls} text-right`}>
                {role === 'lawyer' && (
                  <div className="flex items-center justify-end gap-4">
                    {i.status === 'draft' && <Link href={`${basePath}/${i.id}/edit`} className={linkCls}>Edit</Link>}
                    {i.status === 'draft' && <StatusForm id={i.id} status="sent" label="Mark sent" />}
                    {i.status === 'sent' && <StatusForm id={i.id} status="paid" label="Mark paid" />}
                    {i.status === 'draft' && (
                      <form action={deleteInvoice}>
                        <input type="hidden" name="id" value={i.id} />
                        <ConfirmButton message="Delete this draft invoice permanently?" className={dangerLinkCls}>Delete</ConfirmButton>
                      </form>
                    )}
                    {i.status === 'sent' && <StatusForm id={i.id} status="void" label="Void" danger />}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
