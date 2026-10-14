import type { CaseStatus, EventKind, InvoiceStatus, Priority } from './constants'

export type UserRole = 'super_admin' | 'lawyer' | 'client'

export const ROLE_HOME: Record<UserRole, string> = {
  super_admin: '/admin',
  lawyer: '/lawyer',
  client: '/client',
}

export const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: 'Super admin',
  lawyer: 'Lawyer',
  client: 'Client',
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  lawyer_id: string | null
  is_active: boolean
  created_at: string
  // null until the person has chosen a password (i.e. still "Invited")
  password_set_at: string | null
  phone: string | null
  firm_name: string | null
  notify_email: boolean
  mfa_enabled: boolean
}

export type ActionState =
  | {
      error?: string
      success?: string
      // one-time setup link to hand to the new user
      link?: string
      // echoed back so forms can keep what was typed after an error
      fields?: Record<string, string>
    }
  | undefined

export interface CaseRow {
  id: string
  lawyer_id: string
  client_id: string
  case_number: string
  title: string
  case_type: string
  status: CaseStatus
  court: string | null
  opposing_party: string | null
  description: string | null
  opened_on: string
  closed_on: string | null
  created_at: string
  updated_at: string
}

export interface MessageRow {
  id: string
  case_id: string
  author_id: string
  body: string
  created_at: string
}

export type NoteRow = MessageRow

export interface DocumentRow {
  id: string
  case_id: string
  uploaded_by: string
  name: string
  storage_path: string
  size_bytes: number
  mime_type: string | null
  visible_to_client: boolean
  created_at: string
}

export interface EventRow {
  id: string
  lawyer_id: string
  case_id: string | null
  title: string
  kind: EventKind
  starts_at: string
  location: string | null
  notes: string | null
  visible_to_client: boolean
  created_at: string
}

export interface TaskRow {
  id: string
  lawyer_id: string
  case_id: string | null
  title: string
  due_date: string | null
  priority: Priority
  done: boolean
  created_at: string
}

export interface InvoiceRow {
  id: string
  lawyer_id: string
  client_id: string
  case_id: string | null
  number: string
  description: string | null
  amount_cents: number
  currency: string
  status: InvoiceStatus
  issued_on: string
  due_on: string | null
  paid_on: string | null
  created_at: string
}
