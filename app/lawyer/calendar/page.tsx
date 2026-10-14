import ActionForm from '@/components/ActionForm'
import Card from '@/components/Card'
import EventList from '@/components/EventList'
import PageHeader from '@/components/PageHeader'
import { Checkbox, Field, Select, TextArea } from '@/components/Field'
import { requireRole } from '@/lib/auth'
import { EVENT_KINDS, EVENT_KIND_LABEL } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import type { CaseRow, EventRow } from '@/lib/types'
import { addEvent } from '../practice-actions'

export default async function CalendarPage() {
  const me = await requireRole('lawyer')
  const supabase = await createClient()
  const now = new Date().toISOString()

  const [upRes, pastRes, caseRes] = await Promise.all([
    supabase.from('events').select('*').eq('lawyer_id', me.id).gte('starts_at', now).order('starts_at', { ascending: true }).limit(100),
    supabase.from('events').select('*').eq('lawyer_id', me.id).lt('starts_at', now).order('starts_at', { ascending: false }).limit(10),
    supabase.from('cases').select('id, title, case_number').eq('lawyer_id', me.id).order('title'),
  ])
  const upcoming = (upRes.data ?? []) as EventRow[]
  const past = (pastRes.data ?? []) as EventRow[]
  const cases = (caseRes.data ?? []) as Pick<CaseRow, 'id' | 'title' | 'case_number'>[]
  const caseTitles = Object.fromEntries(cases.map((c) => [c.id, c.title]))

  return (
    <>
      <PageHeader title="Calendar" description="Hearings, meetings and deadlines. Times are shown exactly as you enter them." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title={`Upcoming (${upcoming.length})`} padded={false}>
            <EventList events={upcoming} caseTitles={caseTitles} cases={cases} canEdit emptyHint="Use the form to schedule your first event." />
          </Card>
          {past.length > 0 && (
            <Card title="Recently passed" padded={false}>
              <EventList events={past} caseTitles={caseTitles} cases={cases} canEdit />
            </Card>
          )}
        </div>

        <Card title="Add an event" className="h-fit">
          <ActionForm action={addEvent} submitLabel="Add event" pendingLabel="Adding...">
            <Field label="Title" name="title" required />
            <Select label="Type" name="kind" defaultValue="meeting" options={EVENT_KINDS.map((k) => ({ value: k, label: EVENT_KIND_LABEL[k] }))} />
            <Field label="Date and time" name="starts_at" type="datetime-local" required />
            <Field label="Location" name="location" />
            <Select
              label="Related case" name="case_id" emptyLabel="None (private)"
              options={cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title}` }))}
            />
            <TextArea label="Notes" name="notes" rows={2} maxLength={1000} />
            <Checkbox name="visible_to_client" label="Show to the client (needs a related case)" />
          </ActionForm>
        </Card>
      </div>
    </>
  )
}
