// Fills a DEMO lawyer account with realistic sample data (clients, cases, messages,
// calendar, tasks, invoices) so you can show the product with real-looking screens.
// Usage:  npm run seed-demo        (never run this on a production database)
// Uses plain HTTP (fetch), so it works on Node 18, 20 and 22.

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('\n✖ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local\n')
  process.exit(1)
}

const PASSWORD = 'DemoPass2026!'
const LAWYER = { email: 'demo.lawyer@example.com', name: 'Ayesha Rahman', firm: 'Rahman & Associates', phone: '+92 300 1234567' }
const CLIENTS = [
  { email: 'demo.client1@example.com', name: 'Bilal Ahmed', phone: '+92 301 1112233' },
  { email: 'demo.client2@example.com', name: 'Sana Malik', phone: '+92 302 4445566' },
]

const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
async function call(method, path, body, extra = {}) {
  const res = await fetch(`${url}${path}`, { method, headers: { ...headers, ...extra }, body: body ? JSON.stringify(body) : undefined })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch {}
  if (!res.ok) {
    console.error(`\n✖ ${method} ${path} failed (${res.status}): ${text}`)
    console.error('  → Did you run the CONTENTS of supabase/schema.sql in the SQL Editor first?\n')
    process.exit(1)
  }
  return json
}
const insert = (table, rows) =>
  call('POST', `/rest/v1/${table}`, rows, { Prefer: 'return=representation' })

async function createUser(email, name) {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST', headers,
    body: JSON.stringify({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: name } }),
  })
  const json = await res.json()
  if (!res.ok || !json.id) {
    console.error(`\n✖ Could not create ${email}: ${JSON.stringify(json)}\n`)
    process.exit(1)
  }
  return json.id
}

const existing = await call('GET', `/rest/v1/profiles?email=eq.${LAWYER.email}&select=id`)
if (existing.length) {
  console.log('\nℹ Demo data already exists. Sign in as', LAWYER.email, '/', PASSWORD, '\n')
  process.exit(0)
}

const now = Date.now()
const day = 86400000
const iso = (offsetDays, hour = 10) => {
  const d = new Date(now + offsetDays * day)
  d.setUTCHours(hour, 0, 0, 0)
  return d.toISOString()
}
const ymd = (offsetDays) => new Date(now + offsetDays * day).toISOString().slice(0, 10)

console.log('Creating demo lawyer and clients...')
const lawyerId = await createUser(LAWYER.email, LAWYER.name)
await insert('profiles', [{
  id: lawyerId, email: LAWYER.email, full_name: LAWYER.name, role: 'lawyer',
  firm_name: LAWYER.firm, phone: LAWYER.phone, password_set_at: new Date().toISOString(),
}])

const clientIds = []
for (const c of CLIENTS) {
  const id = await createUser(c.email, c.name)
  await insert('profiles', [{
    id, email: c.email, full_name: c.name, role: 'client', lawyer_id: lawyerId,
    phone: c.phone, password_set_at: new Date().toISOString(),
  }])
  clientIds.push(id)
}

console.log('Creating cases, messages, calendar, tasks and invoices...')
const cases = await insert('cases', [
  { lawyer_id: lawyerId, client_id: clientIds[0], title: 'Ahmed vs. City Developers', case_type: 'Property', status: 'in_progress',
    court: 'Lahore High Court', opposing_party: 'City Developers (Pvt) Ltd', opened_on: ymd(-45),
    description: 'Recovery of plot possession and damages for delayed handover.' },
  { lawyer_id: lawyerId, client_id: clientIds[0], title: 'Tenancy dispute: Gulberg shop', case_type: 'Civil', status: 'open',
    court: 'Civil Court, Lahore', opposing_party: 'M. Tariq', opened_on: ymd(-12),
    description: 'Eviction notice and arrears of rent.' },
  { lawyer_id: lawyerId, client_id: clientIds[1], title: 'Malik family: inheritance partition', case_type: 'Family', status: 'on_hold',
    court: 'Family Court, Islamabad', opposing_party: 'Estate of late A. Malik', opened_on: ymd(-90),
    description: 'Partition of ancestral property among legal heirs.' },
  { lawyer_id: lawyerId, client_id: clientIds[1], title: 'Malik Traders: contract review', case_type: 'Corporate', status: 'closed',
    opened_on: ymd(-120), description: 'Review and negotiation of a supply agreement.' },
])

await insert('case_messages', [
  { case_id: cases[0].id, author_id: lawyerId, body: 'Good morning Bilal. The first hearing has been fixed. Please send the allotment letter when you can.' },
  { case_id: cases[0].id, author_id: clientIds[0], body: 'Thank you. I will upload the allotment letter and payment receipts today.' },
  { case_id: cases[2].id, author_id: lawyerId, body: 'Hello Sana, we are waiting for the heirship certificate before proceeding.' },
])
await insert('case_notes', [
  { case_id: cases[0].id, author_id: lawyerId, body: 'Strategy: lead with the delayed-handover clause; settlement range to be discussed after first hearing.' },
])
await insert('events', [
  { lawyer_id: lawyerId, case_id: cases[0].id, title: 'First hearing', kind: 'hearing', starts_at: iso(3, 9), location: 'Lahore High Court, Court Room 4', visible_to_client: true },
  { lawyer_id: lawyerId, case_id: cases[0].id, title: 'Client prep meeting', kind: 'meeting', starts_at: iso(1, 15), location: 'Office', visible_to_client: true },
  { lawyer_id: lawyerId, case_id: cases[1].id, title: 'File written reply', kind: 'deadline', starts_at: iso(8, 12), visible_to_client: true },
  { lawyer_id: lawyerId, case_id: cases[2].id, title: 'Heirship certificate follow-up', kind: 'other', starts_at: iso(5, 11), visible_to_client: false },
])
await insert('tasks', [
  { lawyer_id: lawyerId, case_id: cases[0].id, title: 'Draft rejoinder to opposing reply', due_date: ymd(2), priority: 'high' },
  { lawyer_id: lawyerId, case_id: cases[1].id, title: 'Collect tenancy agreement from client', due_date: ymd(-1), priority: 'medium' },
  { lawyer_id: lawyerId, title: 'Renew bar council subscription', due_date: ymd(20), priority: 'low' },
  { lawyer_id: lawyerId, case_id: cases[2].id, title: 'Request heirship certificate copy', due_date: ymd(4), priority: 'medium' },
])
await insert('invoices', [
  { lawyer_id: lawyerId, client_id: clientIds[0], case_id: cases[0].id, description: 'Legal fees: pleadings and first appearance', amount_cents: 15000000, currency: 'PKR', status: 'sent', due_on: ymd(14) },
  { lawyer_id: lawyerId, client_id: clientIds[1], case_id: cases[3].id, description: 'Contract review and negotiation', amount_cents: 8500000, currency: 'PKR', status: 'paid', due_on: ymd(-60) },
  { lawyer_id: lawyerId, client_id: clientIds[1], case_id: cases[2].id, description: 'Consultation and document preparation', amount_cents: 4000000, currency: 'PKR', status: 'draft' },
])

console.log('\n✔ Demo data ready. Sign in with password:', PASSWORD)
console.log('   Lawyer :', LAWYER.email)
CLIENTS.forEach((c) => console.log('   Client :', c.email))
console.log('\n⚠ Demo only: delete these accounts before going live.\n')
