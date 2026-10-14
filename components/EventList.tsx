import { deleteEvent, updateEvent } from '@/app/lawyer/practice-actions'
import { EVENT_KINDS, EVENT_KIND_LABEL } from '@/lib/constants'
import { formatDate, formatTime } from '@/lib/format'
import type { EventRow } from '@/lib/types'
import ActionForm from './ActionForm'
import { Badge } from './Badge'
import ConfirmButton from './ConfirmButton'
import EmptyState from './EmptyState'
import { Checkbox, Field, Select, TextArea } from './Field'
import { dangerLinkCls } from './ui'

type CaseOption = { id: string; title: string; case_number: string }

export default function EventList({
  events, caseTitles = {}, canEdit = false, emptyHint, cases,
}: {
  events: EventRow[]; caseTitles?: Record<string, string>; canEdit?: boolean
  emptyHint?: string; cases?: CaseOption[]
}) {
  if (events.length === 0) return <EmptyState title="Nothing scheduled" hint={emptyHint} />

  return (
    <ul className="divide-y divide-slate-100">
      {events.map((e) => (
        <li key={e.id} className="px-5 py-3.5">
          <div className="flex items-start gap-4">
            <div className="w-16 shrink-0 rounded-xl bg-brand-50 py-1.5 text-center">
              <p className="text-xs font-medium uppercase text-brand-600">
                {new Date(e.starts_at).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}
              </p>
              <p className="text-lg font-semibold leading-tight text-brand-900">
                {new Date(e.starts_at).toLocaleDateString('en-GB', { day: '2-digit', timeZone: 'UTC' })}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{e.title}</p>
              <p className="text-xs text-slate-500">
                {formatDate(e.starts_at)} · {formatTime(e.starts_at)}
                {e.location ? ` · ${e.location}` : ''}
                {e.case_id && caseTitles[e.case_id] ? ` · ${caseTitles[e.case_id]}` : ''}
              </p>
              {e.notes && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{e.notes}</p>}
              <div className="mt-1.5 flex gap-2">
                <Badge tone={e.kind === 'deadline' ? 'red' : e.kind === 'hearing' ? 'indigo' : 'blue'}>
                  {EVENT_KIND_LABEL[e.kind]}
                </Badge>
                {canEdit && (e.visible_to_client ? <Badge tone="green">Visible to client</Badge> : <Badge>Private</Badge>)}
              </div>
            </div>
            {canEdit && (
              <form action={deleteEvent}>
                <input type="hidden" name="id" value={e.id} />
                <ConfirmButton message="Delete this event?" className={dangerLinkCls}>Delete</ConfirmButton>
              </form>
            )}
          </div>

          {canEdit && (
            <details className="mt-1 pl-0 sm:pl-20">
              <summary className="cursor-pointer text-xs font-medium text-brand-700 hover:underline">Edit</summary>
              <div className="mt-3 rounded-xl bg-slate-50 p-4">
                <ActionForm action={updateEvent} submitLabel="Save event" pendingLabel="Saving..." resetOnSuccess={false}>
                  <input type="hidden" name="id" value={e.id} />
                  {!cases && <input type="hidden" name="case_id" value={e.case_id ?? ''} />}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field id={`e-title-${e.id}`} label="Title" name="title" required defaultValue={e.title} />
                    <Select id={`e-kind-${e.id}`} label="Type" name="kind" defaultValue={e.kind}
                      options={EVENT_KINDS.map((k) => ({ value: k, label: EVENT_KIND_LABEL[k] }))} />
                    <Field id={`e-start-${e.id}`} label="Date and time" name="starts_at" type="datetime-local" required defaultValue={e.starts_at.slice(0, 16)} />
                    <Field id={`e-loc-${e.id}`} label="Location" name="location" defaultValue={e.location} />
                    {cases && (
                      <div className="sm:col-span-2">
                        <Select id={`e-case-${e.id}`} label="Related case" name="case_id" emptyLabel="None (private)" defaultValue={e.case_id ?? ''}
                          options={cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title}` }))} />
                      </div>
                    )}
                    <div className="sm:col-span-2"><TextArea id={`e-notes-${e.id}`} label="Notes" name="notes" rows={2} maxLength={1000} defaultValue={e.notes} /></div>
                  </div>
                  <Checkbox name="visible_to_client" label="Show to the client (needs a related case)" defaultChecked={e.visible_to_client} />
                </ActionForm>
              </div>
            </details>
          )}
        </li>
      ))}
    </ul>
  )
}
