import Card from '@/components/Card'
import EventList from '@/components/EventList'
import PageHeader from '@/components/PageHeader'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { EventRow } from '@/lib/types'

export default async function ClientAppointmentsPage() {
  const me = await requireRole('client')
  const supabase = await createClient()
  const now = new Date().toISOString()

  const [upRes, pastRes, caseRes] = await Promise.all([
    supabase.from('events').select('*').gte('starts_at', now).order('starts_at', { ascending: true }).limit(100),
    supabase.from('events').select('*').lt('starts_at', now).order('starts_at', { ascending: false }).limit(10),
    supabase.from('cases').select('id, title').eq('client_id', me.id),
  ])
  const caseTitles = Object.fromEntries(((caseRes.data ?? []) as { id: string; title: string }[]).map((c) => [c.id, c.title]))

  return (
    <>
      <PageHeader title="Appointments" description="Hearings, meetings and deadlines your lawyer has shared with you." />
      <div className="space-y-6">
        <Card title="Upcoming" padded={false}>
          <EventList events={(upRes.data ?? []) as EventRow[]} caseTitles={caseTitles} emptyHint="Nothing scheduled right now." />
        </Card>
        {(pastRes.data ?? []).length > 0 && (
          <Card title="Recently passed" padded={false}>
            <EventList events={(pastRes.data ?? []) as EventRow[]} caseTitles={caseTitles} />
          </Card>
        )}
      </div>
    </>
  )
}
