import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import Card from '@/components/Card'
import CaseMessages from '@/components/CaseMessages'
import ConfirmButton from '@/components/ConfirmButton'
import DocumentList from '@/components/DocumentList'
import EmptyState from '@/components/EmptyState'
import EventList from '@/components/EventList'
import InvoiceTable from '@/components/InvoiceTable'
import TaskList from '@/components/TaskList'
import { Checkbox, Field, FileInput, Select, TextArea } from '@/components/Field'
import { buttonCls, dangerBtnCls, dangerLinkCls } from '@/components/ui'
import {
  CASE_STATUSES, CASE_STATUS_LABEL, CASE_TYPES, EVENT_KINDS, EVENT_KIND_LABEL, PRIORITIES,
} from '@/lib/constants'
import { getNames, nameOf } from '@/lib/data'
import { formatDate, formatDateTime } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import type {
  CaseRow, DocumentRow, EventRow, InvoiceRow, MessageRow, NoteRow, Profile, TaskRow,
} from '@/lib/types'
import { uploadDocument } from '@/app/actions/documents'
import { addEvent, addNote, addTask, deleteCase, deleteNote, updateCase } from '../../practice-actions'

type Props = { c: CaseRow; me: Profile; clientName: string }

export function OverviewTab({ c, clientName }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="Details" className="lg:col-span-1">
        <dl className="space-y-3 text-sm">
          <div><dt className="text-slate-500">Client</dt><dd className="text-slate-900">{clientName}</dd></div>
          <div><dt className="text-slate-500">Type</dt><dd className="text-slate-900">{c.case_type}</dd></div>
          <div><dt className="text-slate-500">Court / forum</dt><dd className="text-slate-900">{c.court || '—'}</dd></div>
          <div><dt className="text-slate-500">Opposing party</dt><dd className="text-slate-900">{c.opposing_party || '—'}</dd></div>
          <div><dt className="text-slate-500">Opened</dt><dd className="text-slate-900">{formatDate(c.opened_on)}</dd></div>
          {c.closed_on && <div><dt className="text-slate-500">Closed</dt><dd className="text-slate-900">{formatDate(c.closed_on)}</dd></div>}
        </dl>
      </Card>

      <Card title="Edit case" className="lg:col-span-2">
        <ActionForm action={updateCase} submitLabel="Save changes" resetOnSuccess={false}>
          <input type="hidden" name="id" value={c.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Case title" name="title" required defaultValue={c.title} />
            <Select label="Case type" name="case_type" defaultValue={c.case_type} options={CASE_TYPES.map((t) => ({ value: t, label: t }))} />
            <Select label="Status" name="status" defaultValue={c.status} options={CASE_STATUSES.map((s) => ({ value: s, label: CASE_STATUS_LABEL[s] }))} />
            <Field label="Court / forum" name="court" defaultValue={c.court} />
            <Field label="Opposing party" name="opposing_party" defaultValue={c.opposing_party} />
          </div>
          <TextArea label="Case summary (visible to the client)" name="description" rows={4} defaultValue={c.description} />
        </ActionForm>
      </Card>

      <Card title="Delete this case" className="border-alert-200 lg:col-span-3">
        <p className="mb-4 text-sm text-slate-600">
          This permanently removes the case together with its messages, private notes, documents, tasks and events.
          Invoices are kept but unlinked. This cannot be undone. If the matter is simply finished, set its status to
          Closed instead.
        </p>
        <ActionForm action={deleteCase} submitLabel="Delete case permanently" pendingLabel="Deleting..." buttonClassName={dangerBtnCls} resetOnSuccess={false}>
          <input type="hidden" name="id" value={c.id} />
          <div className="max-w-sm">
            <Field label={`Type ${c.case_number} to confirm`} name="confirm" required />
          </div>
        </ActionForm>
      </Card>
    </div>
  )
}

export async function MessagesTab({ c, me }: Props) {
  const supabase = await createClient()
  const { data } = await supabase.from('case_messages').select('*').eq('case_id', c.id).order('created_at', { ascending: true }).limit(300)
  const messages = (data ?? []) as MessageRow[]
  const names = await getNames(supabase, [c.client_id, me.id])
  return (
    <Card title="Conversation with client">
      <CaseMessages caseId={c.id} meId={me.id} messages={messages} names={names} />
    </Card>
  )
}

export async function DocumentsTab({ c, me }: Props) {
  const supabase = await createClient()
  const { data } = await supabase.from('documents').select('*').eq('case_id', c.id).order('created_at', { ascending: false })
  const docs = (data ?? []) as DocumentRow[]
  const names = await getNames(supabase, docs.map((d) => d.uploaded_by))
  return (
    <div className="space-y-6">
      <Card title="Upload a document">
        <ActionForm action={uploadDocument} submitLabel="Upload" pendingLabel="Uploading...">
          <input type="hidden" name="case_id" value={c.id} />
          <FileInput />
          <Checkbox name="visible_to_client" label="Share with the client" />
        </ActionForm>
      </Card>
      <Card title={`Documents (${docs.length})`} padded={false}>
        <DocumentList docs={docs} names={names} role="lawyer" meId={me.id} showCase={false} />
      </Card>
    </div>
  )
}

export async function TasksTab({ c }: Props) {
  const supabase = await createClient()
  const { data } = await supabase.from('tasks').select('*').eq('case_id', c.id)
    .order('done').order('due_date', { ascending: true, nullsFirst: false })
  const tasks = (data ?? []) as TaskRow[]
  return (
    <div className="space-y-6">
      <Card title="Add a task">
        <ActionForm action={addTask} submitLabel="Add task" pendingLabel="Adding...">
          <input type="hidden" name="case_id" value={c.id} />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3"><Field label="Task" name="title" required /></div>
            <Field label="Due date" name="due_date" type="date" />
            <Select label="Priority" name="priority" defaultValue="medium" options={PRIORITIES.map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }))} />
          </div>
        </ActionForm>
      </Card>
      <Card title={`Tasks (${tasks.length})`} padded={false}>
        <TaskList tasks={tasks} showCase={false} />
      </Card>
    </div>
  )
}

export async function ScheduleTab({ c }: Props) {
  const supabase = await createClient()
  const { data } = await supabase.from('events').select('*').eq('case_id', c.id).order('starts_at', { ascending: true })
  const events = (data ?? []) as EventRow[]
  return (
    <div className="space-y-6">
      <Card title="Schedule an event">
        <ActionForm action={addEvent} submitLabel="Add event" pendingLabel="Adding...">
          <input type="hidden" name="case_id" value={c.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" name="title" required placeholder="Event title" />
            <Select label="Type" name="kind" defaultValue="hearing" options={EVENT_KINDS.map((k) => ({ value: k, label: EVENT_KIND_LABEL[k] }))} />
            <Field label="Date and time" name="starts_at" type="datetime-local" required />
            <Field label="Location" name="location" placeholder="Court room, office, video link..." />
          </div>
          <TextArea label="Notes" name="notes" rows={2} maxLength={1000} />
          <Checkbox name="visible_to_client" label="Show to the client on their appointments page" />
        </ActionForm>
      </Card>
      <Card title={`Events (${events.length})`} padded={false}>
        <EventList events={events} canEdit />
      </Card>
    </div>
  )
}

export async function NotesTab({ c, me }: Props) {
  const supabase = await createClient()
  const { data } = await supabase.from('case_notes').select('*').eq('case_id', c.id).order('created_at', { ascending: false })
  const notes = (data ?? []) as NoteRow[]
  const names = await getNames(supabase, [me.id])
  return (
    <div className="space-y-6">
      <Card title="Private notes">
        <p className="mb-4 text-sm text-slate-600">Only you can see these. They are never shown to the client or to platform administrators.</p>
        <ActionForm action={addNote} submitLabel="Save note" pendingLabel="Saving...">
          <input type="hidden" name="case_id" value={c.id} />
          <TextArea name="body" rows={3} required placeholder="Strategy, observations, reminders..." />
        </ActionForm>
      </Card>
      <Card title={`Notes (${notes.length})`} padded={false}>
        {notes.length === 0 ? (
          <EmptyState title="No notes yet" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {notes.map((n) => (
              <li key={n.id} className="px-5 py-4">
                <p className="whitespace-pre-wrap text-sm text-slate-900">{n.body}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{nameOf(names, n.author_id)} · {formatDateTime(n.created_at)}</span>
                  <form action={deleteNote}>
                    <input type="hidden" name="id" value={n.id} />
                    <input type="hidden" name="case_id" value={c.id} />
                    <ConfirmButton message="Delete this note?" className={dangerLinkCls}>Delete</ConfirmButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

export async function BillingTab({ c, me }: Props) {
  const supabase = await createClient()
  const { data } = await supabase.from('invoices').select('*').eq('case_id', c.id).order('created_at', { ascending: false })
  const invoices = (data ?? []) as InvoiceRow[]
  const names = await getNames(supabase, [c.client_id, me.id])
  return (
    <Card
      title={`Invoices (${invoices.length})`}
      padded={false}
      action={<Link href={`/lawyer/billing?case=${c.id}`} className={buttonCls}>Create invoice</Link>}
    >
      <InvoiceTable invoices={invoices} names={names} role="lawyer" basePath="/lawyer/billing" />
    </Card>
  )
}
