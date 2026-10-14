import { notFound } from 'next/navigation'
import ActionForm from '@/components/ActionForm'
import Card from '@/components/Card'
import CaseMessages from '@/components/CaseMessages'
import DocumentList from '@/components/DocumentList'
import EventList from '@/components/EventList'
import InvoiceTable from '@/components/InvoiceTable'
import PageHeader from '@/components/PageHeader'
import TabNav from '@/components/TabNav'
import { CaseStatusBadge } from '@/components/Badge'
import { FileInput } from '@/components/Field'
import { requireRole } from '@/lib/auth'
import { getNames, nameOf } from '@/lib/data'
import { isUuid } from '@/lib/form'
import { formatDate } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import type { CaseRow, DocumentRow, EventRow, InvoiceRow, MessageRow } from '@/lib/types'
import { uploadDocument } from '@/app/actions/documents'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'messages', label: 'Messages' },
  { key: 'documents', label: 'Documents' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'invoices', label: 'Invoices' },
]

export default async function ClientCaseDetail({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const me = await requireRole('client')
  const { id } = await params
  const { tab = 'overview' } = await searchParams
  if (!isUuid(id)) notFound()

  const supabase = await createClient()
  const { data } = await supabase.from('cases').select('*').eq('id', id).eq('client_id', me.id).maybeSingle()
  if (!data) notFound()
  const c = data as CaseRow

  const lawyerNames = await getNames(supabase, [c.lawyer_id, me.id])
  const active = TABS.some((t) => t.key === tab) ? tab : 'overview'

  let body: React.ReactNode = null

  if (active === 'overview') {
    body = (
      <Card title="Case details">
        <dl className="grid gap-5 text-sm sm:grid-cols-3">
          <div><dt className="text-slate-500">Lawyer</dt><dd className="mt-0.5 text-slate-900">{nameOf(lawyerNames, c.lawyer_id)}</dd></div>
          <div><dt className="text-slate-500">Case type</dt><dd className="mt-0.5 text-slate-900">{c.case_type}</dd></div>
          <div><dt className="text-slate-500">Status</dt><dd className="mt-0.5"><CaseStatusBadge status={c.status} /></dd></div>
          <div><dt className="text-slate-500">Court / forum</dt><dd className="mt-0.5 text-slate-900">{c.court || '—'}</dd></div>
          <div><dt className="text-slate-500">Opposing party</dt><dd className="mt-0.5 text-slate-900">{c.opposing_party || '—'}</dd></div>
          <div><dt className="text-slate-500">Opened</dt><dd className="mt-0.5 text-slate-900">{formatDate(c.opened_on)}</dd></div>
        </dl>
        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-sm font-medium text-slate-900">Summary</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{c.description || 'Your lawyer has not added a summary yet.'}</p>
        </div>
      </Card>
    )
  } else if (active === 'messages') {
    const { data: m } = await supabase.from('case_messages').select('*').eq('case_id', c.id).order('created_at', { ascending: true }).limit(300)
    body = (
      <Card title="Conversation with your lawyer">
        <CaseMessages caseId={c.id} meId={me.id} messages={(m ?? []) as MessageRow[]} names={lawyerNames} />
      </Card>
    )
  } else if (active === 'documents') {
    const { data: d } = await supabase.from('documents').select('*').eq('case_id', c.id).order('created_at', { ascending: false })
    const docs = (d ?? []) as DocumentRow[]
    const names = await getNames(supabase, docs.map((x) => x.uploaded_by))
    body = (
      <div className="space-y-6">
        <Card title="Send a document to your lawyer">
          <ActionForm action={uploadDocument} submitLabel="Upload" pendingLabel="Uploading...">
            <input type="hidden" name="case_id" value={c.id} />
            <FileInput />
          </ActionForm>
        </Card>
        <Card title={`Documents (${docs.length})`} padded={false}>
          <DocumentList docs={docs} names={names} role="client" meId={me.id} showCase={false} />
        </Card>
      </div>
    )
  } else if (active === 'appointments') {
    const { data: e } = await supabase.from('events').select('*').eq('case_id', c.id).order('starts_at', { ascending: true })
    body = (
      <Card title="Appointments" padded={false}>
        <EventList events={(e ?? []) as EventRow[]} emptyHint="Hearings and meetings your lawyer shares will appear here." />
      </Card>
    )
  } else {
    const { data: i } = await supabase.from('invoices').select('*').eq('case_id', c.id).eq('client_id', me.id).order('created_at', { ascending: false })
    body = (
      <Card title="Invoices" padded={false}>
        <InvoiceTable invoices={(i ?? []) as InvoiceRow[]} names={lawyerNames} role="client" basePath="/client/invoices" />
      </Card>
    )
  }

  return (
    <>
      <PageHeader
        title={c.title}
        description={c.case_number}
        back={{ href: '/client/cases', label: 'My cases' }}
        actions={<CaseStatusBadge status={c.status} />}
      />
      <TabNav base={`/client/cases/${c.id}`} tabs={TABS} active={active} />
      <div className="mt-6">{body}</div>
    </>
  )
}
