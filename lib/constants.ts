export const CASE_STATUSES = ['open', 'in_progress', 'on_hold', 'closed'] as const
export type CaseStatus = (typeof CASE_STATUSES)[number]
export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  on_hold: 'On hold',
  closed: 'Closed',
}

export const CASE_TYPES = [
  'Civil', 'Criminal', 'Family', 'Corporate', 'Property', 'Labour',
  'Tax', 'Immigration', 'Intellectual property', 'Other',
] as const

export const EVENT_KINDS = ['hearing', 'meeting', 'deadline', 'other'] as const
export type EventKind = (typeof EVENT_KINDS)[number]
export const EVENT_KIND_LABEL: Record<EventKind, string> = {
  hearing: 'Court hearing',
  meeting: 'Meeting',
  deadline: 'Deadline',
  other: 'Other',
}

export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'void'] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]
export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  void: 'Void',
}

export const PRIORITIES = ['low', 'medium', 'high'] as const
export type Priority = (typeof PRIORITIES)[number]

export const CURRENCIES = ['PKR', 'USD', 'GBP', 'EUR', 'AED'] as const

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
export const BUCKET = 'case-documents'
// extension -> content type. Anything not listed is rejected.
export const ALLOWED_FILES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}
