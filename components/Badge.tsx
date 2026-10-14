import {
  CASE_STATUS_LABEL, INVOICE_STATUS_LABEL,
  type CaseStatus, type InvoiceStatus, type Priority,
} from '@/lib/constants'

const TONES = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-green-50 text-green-700',
  red: 'bg-alert-50 text-alert-700',
  amber: 'bg-amber-50 text-amber-800',
  blue: 'bg-blue-50 text-blue-700',
  indigo: 'bg-brand-50 text-brand-800',
}

export function Badge({ tone = 'slate', children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  )
}

const CASE_TONE: Record<CaseStatus, keyof typeof TONES> = {
  open: 'blue', in_progress: 'indigo', on_hold: 'amber', closed: 'slate',
}
export const CaseStatusBadge = ({ status }: { status: CaseStatus }) => (
  <Badge tone={CASE_TONE[status]}>{CASE_STATUS_LABEL[status]}</Badge>
)

const INV_TONE: Record<InvoiceStatus, keyof typeof TONES> = {
  draft: 'slate', sent: 'amber', paid: 'green', void: 'red',
}
export const InvoiceStatusBadge = ({ status }: { status: InvoiceStatus }) => (
  <Badge tone={INV_TONE[status]}>{INVOICE_STATUS_LABEL[status]}</Badge>
)

const PRIO_TONE: Record<Priority, keyof typeof TONES> = { low: 'slate', medium: 'blue', high: 'red' }
export const PriorityBadge = ({ priority }: { priority: Priority }) => (
  <Badge tone={PRIO_TONE[priority]}>{priority[0].toUpperCase() + priority.slice(1)}</Badge>
)

export function AccountStatusBadge({
  isActive, passwordSetAt, mfaEnabled,
}: { isActive: boolean; passwordSetAt: string | null; mfaEnabled?: boolean }) {
  const main = !isActive ? <Badge tone="red">Suspended</Badge>
    : !passwordSetAt ? <Badge tone="amber">Invited</Badge>
    : <Badge tone="green">Active</Badge>
  if (!mfaEnabled) return main
  return <span className="inline-flex flex-wrap gap-1.5">{main}<Badge tone="blue">2FA</Badge></span>
}
