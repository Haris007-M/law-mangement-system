import { INVOICE_STATUS_LABEL } from '@/lib/constants'
import { formatDate, formatMoney } from '@/lib/format'
import type { InvoiceRow } from '@/lib/types'
import { BRAND } from '@/lib/brand'

type Party = { name: string; email: string; extra?: string | null }

// Print-friendly invoice (use the Print button, then "Save as PDF").
export default function InvoiceDocument({
  invoice, from, to, caseTitle,
}: { invoice: InvoiceRow; from: Party; to: Party; caseTitle?: string | null }) {
  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 print:border-0 print:shadow-none">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Invoice</h2>
          <p className="mt-1 text-sm text-slate-500">{invoice.number}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">{from.extra || from.name}</p>
          <p className="text-xs text-slate-500">{from.name}</p>
          <p className="text-xs text-slate-500">{from.email}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Billed to</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{to.name}</p>
          <p className="text-sm text-slate-600">{to.email}</p>
        </div>
        <dl className="space-y-1 text-sm sm:text-right">
          <div><dt className="inline text-slate-500">Issued: </dt><dd className="inline text-slate-900">{formatDate(invoice.issued_on)}</dd></div>
          <div><dt className="inline text-slate-500">Due: </dt><dd className="inline text-slate-900">{formatDate(invoice.due_on)}</dd></div>
          <div><dt className="inline text-slate-500">Status: </dt><dd className="inline font-medium text-slate-900">{INVOICE_STATUS_LABEL[invoice.status]}</dd></div>
        </dl>
      </div>

      <table className="no-stack mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100">
            <td className="py-3 text-slate-800">
              <p className="whitespace-pre-wrap">{invoice.description || 'Legal services'}</p>
              {caseTitle && <p className="mt-1 text-xs text-slate-500">Matter: {caseTitle}</p>}
            </td>
            <td className="py-3 text-right text-slate-900">{formatMoney(invoice.amount_cents, invoice.currency)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td className="pt-4 text-right text-sm font-semibold text-slate-900">Total due</td>
            <td className="pt-4 text-right text-lg font-semibold text-slate-900">
              {invoice.status === 'paid' ? formatMoney(0, invoice.currency) : formatMoney(invoice.amount_cents, invoice.currency)}
            </td>
          </tr>
        </tfoot>
      </table>

      {invoice.status === 'paid' && (
        <p className="mt-4 text-right text-sm font-medium text-green-700">Paid in full on {formatDate(invoice.paid_on)}. Thank you.</p>
      )}
      <p className="mt-10 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">Generated with {BRAND.name}</p>
    </div>
  )
}
