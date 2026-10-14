import ActionForm from '@/components/ActionForm'
import Card from '@/components/Card'
import DocumentList from '@/components/DocumentList'
import PageHeader from '@/components/PageHeader'
import { FileInput, Select } from '@/components/Field'
import { requireRole } from '@/lib/auth'
import { getNames } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'
import type { DocumentRow } from '@/lib/types'
import { uploadDocument } from '@/app/actions/documents'

export default async function ClientDocumentsPage() {
  const me = await requireRole('client')
  const supabase = await createClient()

  const [docRes, caseRes] = await Promise.all([
    supabase.from('documents').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('cases').select('id, title, case_number').eq('client_id', me.id).order('title'),
  ])
  const docs = (docRes.data ?? []) as DocumentRow[]
  const cases = (caseRes.data ?? []) as { id: string; title: string; case_number: string }[]
  const caseTitles = Object.fromEntries(cases.map((c) => [c.id, c.title]))
  const names = await getNames(supabase, docs.map((d) => d.uploaded_by))

  return (
    <>
      <PageHeader title="Documents" description="Files shared with you, and files you have sent to your lawyer." />
      <div className="space-y-6">
        <Card title="Send a document to your lawyer">
          {cases.length === 0 ? (
            <p className="text-sm text-slate-600">You can upload documents once your lawyer opens a case for you.</p>
          ) : (
            <ActionForm action={uploadDocument} submitLabel="Upload" pendingLabel="Uploading...">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Case" name="case_id" required emptyLabel="Select a case" options={cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title}` }))} />
                <FileInput />
              </div>
            </ActionForm>
          )}
        </Card>
        <Card title={`Documents (${docs.length})`} padded={false}>
          <DocumentList docs={docs} caseTitles={caseTitles} names={names} role="client" meId={me.id} />
        </Card>
      </div>
    </>
  )
}
