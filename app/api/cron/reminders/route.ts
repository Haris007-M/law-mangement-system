import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mailConfigured, sendNotificationEmail } from '@/lib/mail'
import { getSiteUrl } from '@/lib/site-url'
import { EVENT_KIND_LABEL, type EventKind } from '@/lib/constants'
import { formatDate, formatTime, todayISO } from '@/lib/format'

// Runs once a day (see vercel.json). Sends each person ONE digest email of what is coming up:
//   * events in the next ~36 hours (the lawyer, plus the client if the event is shared)
//   * tasks due today or tomorrow, and overdue ones (lawyer)
// Each item is emailed once (reminded_at). Protected by CRON_SECRET.

function authorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const given = request.headers.get('authorization') ?? ''
  const a = Buffer.from(given)
  const b = Buffer.from(`Bearer ${secret}`)
  return a.length === b.length && timingSafeEqual(a, b)
}

type EventRow = {
  id: string; lawyer_id: string; case_id: string | null; title: string
  kind: EventKind; starts_at: string; visible_to_client: boolean
}
type TaskRow = { id: string; lawyer_id: string; title: string; due_date: string }

export async function GET(request: NextRequest) {
  if (!authorised(request)) return new NextResponse('Unauthorized', { status: 401 })
  if (!mailConfigured()) return NextResponse.json({ ok: true, skipped: 'SMTP is not configured' })

  const admin = createAdminClient()
  const now = new Date()
  const horizon = new Date(now.getTime() + 36 * 3600 * 1000)
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 10)

  const [evRes, taskRes] = await Promise.all([
    admin.from('events').select('id, lawyer_id, case_id, title, kind, starts_at, visible_to_client')
      .is('reminded_at', null).gte('starts_at', now.toISOString()).lte('starts_at', horizon.toISOString()),
    admin.from('tasks').select('id, lawyer_id, title, due_date')
      .is('reminded_at', null).eq('done', false).not('due_date', 'is', null).lte('due_date', tomorrow),
  ])
  const events = (evRes.data ?? []) as EventRow[]
  const tasks = (taskRes.data ?? []) as TaskRow[]

  // client of each shared event
  const caseIds = [...new Set(events.filter((e) => e.visible_to_client && e.case_id).map((e) => e.case_id as string))]
  const caseClient = new Map<string, string>()
  if (caseIds.length) {
    const { data } = await admin.from('cases').select('id, client_id').in('id', caseIds)
    for (const c of (data ?? []) as { id: string; client_id: string }[]) caseClient.set(c.id, c.client_id)
  }

  // build one digest per person
  const digest = new Map<string, string[]>()
  const add = (userId: string, line: string) => digest.set(userId, [...(digest.get(userId) ?? []), line])

  for (const e of events) {
    const line = `• ${EVENT_KIND_LABEL[e.kind]}: ${e.title} (${formatDate(e.starts_at)} at ${formatTime(e.starts_at)})`
    add(e.lawyer_id, line)
    const clientId = e.visible_to_client && e.case_id ? caseClient.get(e.case_id) : undefined
    if (clientId) add(clientId, line)
  }
  const today = todayISO()
  for (const t of tasks) {
    add(t.lawyer_id, `• Task ${t.due_date < today ? 'overdue' : 'due'}: ${t.title} (${formatDate(t.due_date)})`)
  }

  let sent = 0
  if (digest.size) {
    const { data: people } = await admin
      .from('profiles')
      .select('id, email, full_name, notify_email, is_active')
      .in('id', [...digest.keys()])
    const site = await getSiteUrl()

    for (const p of (people ?? []) as { id: string; email: string; full_name: string | null; notify_email: boolean; is_active: boolean }[]) {
      if (!p.is_active || !p.notify_email) continue
      const lines = digest.get(p.id) ?? []
      const res = await sendNotificationEmail({
        to: p.email,
        name: p.full_name ?? p.email,
        subject: `Reminder: ${lines.length} upcoming item${lines.length === 1 ? '' : 's'}`,
        heading: 'Coming up',
        body: lines.join('\n'),
        link: site,
        button: 'Open my dashboard',
      })
      if (res.ok) sent++
    }
  }

  // mark as reminded even for people who opted out, so they are not re-evaluated every day
  const stamp = new Date().toISOString()
  if (events.length) await admin.from('events').update({ reminded_at: stamp }).in('id', events.map((e) => e.id))
  if (tasks.length) await admin.from('tasks').update({ reminded_at: stamp }).in('id', tasks.map((t) => t.id))

  return NextResponse.json({ ok: true, events: events.length, tasks: tasks.length, emails: sent })
}
