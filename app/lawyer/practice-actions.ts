'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { allow } from '@/lib/rate-limit'
import { audit } from '@/lib/audit'
import { notify } from '@/lib/notify'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  dbError, getDate, getDateTime, getEnum, getMoneyCents, getStr, isUuid,
} from '@/lib/form'
import {
  BUCKET, CASE_STATUSES, CASE_TYPES, CURRENCIES, EVENT_KINDS, PRIORITIES,
} from '@/lib/constants'
import type { ActionState } from '@/lib/types'

const optId = (v: string) => (isUuid(v) ? v : null)

function refreshCase(caseId?: string | null) {
  revalidatePath('/lawyer', 'layout')
  if (caseId) {
    revalidatePath(`/lawyer/cases/${caseId}`)
    revalidatePath(`/client/cases/${caseId}`)
  }
}

// ---------- Cases ----------
export async function createCase(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireRole('lawyer')
  const clientId = getStr(fd, 'client_id', 40)
  const title = getStr(fd, 'title', 200)
  if (!isUuid(clientId)) return { error: 'Choose a client.' }
  if (!title) return { error: 'Enter a case title.' }
  if (!(await allow(`case:${me.id}`, 60, 3600))) return { error: 'Too many cases created. Try again later.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cases')
    .insert({
      lawyer_id: me.id,
      client_id: clientId,
      title,
      case_type: getEnum(fd, 'case_type', CASE_TYPES, 'Other'),
      status: getEnum(fd, 'status', CASE_STATUSES, 'open'),
      court: getStr(fd, 'court', 200) || null,
      opposing_party: getStr(fd, 'opposing_party', 200) || null,
      description: getStr(fd, 'description', 4000) || null,
      opened_on: getDate(fd, 'opened_on') ?? undefined,
    })
    .select('id')
    .single()
  if (error || !data) return { error: error ? dbError(error) : 'Could not create the case.' }

  await audit(me.id, 'case.created', data.id, { title })
  revalidatePath('/lawyer', 'layout')
  redirect(`/lawyer/cases/${data.id}`)
}

export async function updateCase(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireRole('lawyer')
  const id = getStr(fd, 'id', 40)
  const title = getStr(fd, 'title', 200)
  if (!isUuid(id)) return { error: 'Case not found.' }
  if (!title) return { error: 'Enter a case title.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cases')
    .update({
      title,
      case_type: getEnum(fd, 'case_type', CASE_TYPES, 'Other'),
      status: getEnum(fd, 'status', CASE_STATUSES, 'open'),
      court: getStr(fd, 'court', 200) || null,
      opposing_party: getStr(fd, 'opposing_party', 200) || null,
      description: getStr(fd, 'description', 4000) || null,
    })
    .eq('id', id)
    .eq('lawyer_id', me.id)
    .select('id')
    .maybeSingle()
  if (error) return { error: dbError(error) }
  if (!data) return { error: 'Case not found.' }

  await audit(me.id, 'case.updated', id)
  refreshCase(id)
  return { success: 'Case updated.' }
}

// Permanent. Messages, notes, documents, events and tasks of the case go with it
// (invoices stay, unlinked). The caller must type the case number to confirm.
export async function deleteCase(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireRole('lawyer')
  const id = getStr(fd, 'id', 40)
  const typed = getStr(fd, 'confirm', 60)
  if (!isUuid(id)) return { error: 'Case not found.' }

  const supabase = await createClient()
  const { data: c } = await supabase.from('cases').select('id, case_number, title')
    .eq('id', id).eq('lawyer_id', me.id).maybeSingle()
  if (!c) return { error: 'Case not found.' }
  if (typed !== c.case_number) return { error: `To confirm, type the case number exactly: ${c.case_number}` }

  const { data: docs } = await supabase.from('documents').select('storage_path').eq('case_id', id)
  const { data: deleted, error } = await supabase.from('cases').delete().eq('id', id).select('id')
  if (error) return { error: dbError(error) }
  if (!deleted?.length) return { error: 'Case not found.' }

  const paths = ((docs ?? []) as { storage_path: string }[]).map((d) => d.storage_path)
  if (paths.length) await createAdminClient().storage.from(BUCKET).remove(paths)

  await audit(me.id, 'case.deleted', id, { case_number: c.case_number, title: c.title })
  revalidatePath('/lawyer', 'layout')
  revalidatePath('/client', 'layout')
  redirect('/lawyer/cases')
}

// ---------- Private notes ----------
export async function addNote(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireRole('lawyer')
  const caseId = getStr(fd, 'case_id', 40)
  const body = getStr(fd, 'body', 4000)
  if (!isUuid(caseId)) return { error: 'Case not found.' }
  if (!body) return { error: 'Write a note first.' }

  const supabase = await createClient()
  const { error } = await supabase.from('case_notes').insert({ case_id: caseId, author_id: me.id, body })
  if (error) return { error: dbError(error) }
  revalidatePath(`/lawyer/cases/${caseId}`)
  return { success: 'Note saved.' }
}

export async function deleteNote(fd: FormData) {
  await requireRole('lawyer')
  const id = getStr(fd, 'id', 40)
  const caseId = getStr(fd, 'case_id', 40)
  if (!isUuid(id)) return
  const supabase = await createClient()
  await supabase.from('case_notes').delete().eq('id', id)
  revalidatePath(`/lawyer/cases/${caseId}`)
}

// ---------- Tasks ----------
export async function addTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireRole('lawyer')
  const title = getStr(fd, 'title', 200)
  if (!title) return { error: 'Enter a task title.' }
  const caseId = optId(getStr(fd, 'case_id', 40))

  const supabase = await createClient()
  const { error } = await supabase.from('tasks').insert({
    lawyer_id: me.id,
    case_id: caseId,
    title,
    due_date: getDate(fd, 'due_date'),
    priority: getEnum(fd, 'priority', PRIORITIES, 'medium'),
  })
  if (error) return { error: dbError(error) }
  refreshCase(caseId)
  return { success: 'Task added.' }
}

export async function updateTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole('lawyer')
  const id = getStr(fd, 'id', 40)
  const title = getStr(fd, 'title', 200)
  if (!isUuid(id)) return { error: 'Task not found.' }
  if (!title) return { error: 'Enter a task title.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .update({
      title,
      due_date: getDate(fd, 'due_date'),
      priority: getEnum(fd, 'priority', PRIORITIES, 'medium'),
      case_id: optId(getStr(fd, 'case_id', 40)),
      reminded_at: null, // a changed date deserves a fresh reminder
    })
    .eq('id', id)
    .select('case_id')
    .maybeSingle()
  if (error) return { error: dbError(error) }
  if (!data) return { error: 'Task not found.' }
  refreshCase(data.case_id)
  return { success: 'Task updated.' }
}

export async function toggleTask(fd: FormData) {
  await requireRole('lawyer')
  const id = getStr(fd, 'id', 40)
  if (!isUuid(id)) return
  const supabase = await createClient()
  const { data } = await supabase
    .from('tasks')
    .update({ done: fd.get('done') === 'true' })
    .eq('id', id)
    .select('case_id')
    .maybeSingle()
  refreshCase(data?.case_id)
}

export async function deleteTask(fd: FormData) {
  await requireRole('lawyer')
  const id = getStr(fd, 'id', 40)
  if (!isUuid(id)) return
  const supabase = await createClient()
  const { data } = await supabase.from('tasks').delete().eq('id', id).select('case_id').maybeSingle()
  refreshCase(data?.case_id)
}

// ---------- Calendar ----------
export async function addEvent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireRole('lawyer')
  const title = getStr(fd, 'title', 200)
  const startsAt = getDateTime(fd, 'starts_at')
  if (!title) return { error: 'Enter an event title.' }
  if (!startsAt) return { error: 'Choose a date and time.' }
  const caseId = optId(getStr(fd, 'case_id', 40))
  const visible = fd.get('visible_to_client') === 'on'
  if (visible && !caseId) return { error: 'Link the event to a case to share it with the client.' }

  const supabase = await createClient()
  const { error } = await supabase.from('events').insert({
    lawyer_id: me.id,
    case_id: caseId,
    title,
    kind: getEnum(fd, 'kind', EVENT_KINDS, 'meeting'),
    starts_at: startsAt,
    location: getStr(fd, 'location', 200) || null,
    notes: getStr(fd, 'notes', 1000) || null,
    visible_to_client: visible,
  })
  if (error) return { error: dbError(error) }

  if (visible && caseId) {
    const { data: c } = await supabase.from('cases').select('client_id, case_number').eq('id', caseId).maybeSingle()
    if (c) {
      await notify({
        toUserId: c.client_id,
        subject: `New appointment on case ${c.case_number}`,
        heading: 'New appointment',
        body: `A new appointment was added to case ${c.case_number}. Sign in to see the date and details.`,
        path: '/client/appointments',
        button: 'View appointments',
      })
    }
  }
  revalidatePath('/client', 'layout')
  refreshCase(caseId)
  return { success: 'Event added.' }
}

export async function updateEvent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole('lawyer')
  const id = getStr(fd, 'id', 40)
  const title = getStr(fd, 'title', 200)
  const startsAt = getDateTime(fd, 'starts_at')
  if (!isUuid(id)) return { error: 'Event not found.' }
  if (!title) return { error: 'Enter an event title.' }
  if (!startsAt) return { error: 'Choose a date and time.' }
  const caseId = optId(getStr(fd, 'case_id', 40))
  const visible = fd.get('visible_to_client') === 'on'
  if (visible && !caseId) return { error: 'Link the event to a case to share it with the client.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .update({
      title,
      kind: getEnum(fd, 'kind', EVENT_KINDS, 'meeting'),
      starts_at: startsAt,
      location: getStr(fd, 'location', 200) || null,
      notes: getStr(fd, 'notes', 1000) || null,
      case_id: caseId,
      visible_to_client: visible,
      reminded_at: null, // new time = new reminder
    })
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) return { error: dbError(error) }
  if (!data) return { error: 'Event not found.' }
  revalidatePath('/client', 'layout')
  refreshCase(caseId)
  return { success: 'Event updated.' }
}

export async function deleteEvent(fd: FormData) {
  await requireRole('lawyer')
  const id = getStr(fd, 'id', 40)
  if (!isUuid(id)) return
  const supabase = await createClient()
  const { data } = await supabase.from('events').delete().eq('id', id).select('case_id').maybeSingle()
  revalidatePath('/client', 'layout')
  refreshCase(data?.case_id)
}

// ---------- Billing ----------
export async function createInvoice(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireRole('lawyer')
  const clientId = getStr(fd, 'client_id', 40)
  const cents = getMoneyCents(fd, 'amount')
  if (!isUuid(clientId)) return { error: 'Choose a client.' }
  if (cents === null) return { error: 'Enter a valid amount, for example 1500.00.' }
  const caseId = optId(getStr(fd, 'case_id', 40))

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      lawyer_id: me.id,
      client_id: clientId,
      case_id: caseId,
      description: getStr(fd, 'description', 1000) || null,
      amount_cents: cents,
      currency: getEnum(fd, 'currency', CURRENCIES, 'USD'),
      status: getEnum(fd, 'status', ['draft', 'sent'] as const, 'draft'),
      due_on: getDate(fd, 'due_on'),
    })
    .select('id, number, status')
    .single()
  if (error || !data) return { error: error ? dbError(error) : 'Could not create the invoice.' }

  await audit(me.id, 'invoice.created', data.id)
  if (data.status === 'sent') {
    await notify({
      toUserId: clientId,
      subject: `New invoice ${data.number}`,
      heading: 'New invoice',
      body: `Invoice ${data.number} is now available in your portal.`,
      path: `/client/invoices/${data.id}`,
      button: 'View invoice',
    })
  }
  revalidatePath('/lawyer/billing')
  revalidatePath('/client', 'layout')
  refreshCase(caseId)
  return { success: 'Invoice created.' }
}

// Only DRAFT invoices can be edited or deleted. Anything already sent must be voided
// so the billing record stays honest (the database enforces this too).
export async function updateInvoice(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireRole('lawyer')
  const id = getStr(fd, 'id', 40)
  const cents = getMoneyCents(fd, 'amount')
  if (!isUuid(id)) return { error: 'Invoice not found.' }
  if (cents === null) return { error: 'Enter a valid amount, for example 1500.00.' }

  const supabase = await createClient()
  const { data: inv } = await supabase.from('invoices').select('status').eq('id', id).eq('lawyer_id', me.id).maybeSingle()
  if (!inv) return { error: 'Invoice not found.' }
  if (inv.status !== 'draft') return { error: 'Only draft invoices can be edited. Void it and create a new one instead.' }

  const { error } = await supabase
    .from('invoices')
    .update({
      case_id: optId(getStr(fd, 'case_id', 40)),
      description: getStr(fd, 'description', 1000) || null,
      amount_cents: cents,
      currency: getEnum(fd, 'currency', CURRENCIES, 'USD'),
      due_on: getDate(fd, 'due_on'),
    })
    .eq('id', id)
    .eq('lawyer_id', me.id)
  if (error) return { error: dbError(error) }

  await audit(me.id, 'invoice.updated', id)
  revalidatePath('/lawyer/billing')
  redirect(`/lawyer/billing/${id}`)
}

export async function deleteInvoice(fd: FormData) {
  const me = await requireRole('lawyer')
  const id = getStr(fd, 'id', 40)
  if (!isUuid(id)) return
  const supabase = await createClient()
  const { data } = await supabase.from('invoices').delete()
    .eq('id', id).eq('lawyer_id', me.id).eq('status', 'draft').select('id')
  if (data?.length) await audit(me.id, 'invoice.deleted', id)
  revalidatePath('/lawyer/billing')
  revalidatePath('/lawyer', 'layout')
}

const NEXT_STATUS: Record<string, string[]> = { draft: ['sent', 'void'], sent: ['paid', 'void'] }

export async function setInvoiceStatus(fd: FormData) {
  const me = await requireRole('lawyer')
  const id = getStr(fd, 'id', 40)
  const status = getStr(fd, 'status', 20)
  if (!isUuid(id)) return

  const supabase = await createClient()
  const { data: inv } = await supabase.from('invoices').select('status, case_id, client_id, number').eq('id', id).maybeSingle()
  if (!inv || !(NEXT_STATUS[inv.status] ?? []).includes(status)) return

  const { error } = await supabase.from('invoices').update({ status }).eq('id', id)
  if (!error) {
    await audit(me.id, `invoice.${status}`, id)
    if (status === 'sent') {
      await notify({
        toUserId: inv.client_id,
        subject: `New invoice ${inv.number}`,
        heading: 'New invoice',
        body: `Invoice ${inv.number} is now available in your portal.`,
        path: `/client/invoices/${id}`,
        button: 'View invoice',
      })
    } else if (status === 'paid') {
      await notify({
        toUserId: inv.client_id,
        subject: `Payment received: ${inv.number}`,
        heading: 'Payment received',
        body: `Invoice ${inv.number} has been marked as paid. Thank you.`,
        path: `/client/invoices/${id}`,
        button: 'View invoice',
      })
    }
  }
  revalidatePath('/lawyer/billing')
  revalidatePath('/client', 'layout')
  refreshCase(inv.case_id)
}
