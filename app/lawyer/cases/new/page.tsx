import Link from 'next/link'
import ActionForm from '@/components/ActionForm'
import Card from '@/components/Card'
import { Field, Select, TextArea } from '@/components/Field'
import PageHeader from '@/components/PageHeader'
import { linkCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { CASE_STATUSES, CASE_STATUS_LABEL, CASE_TYPES } from '@/lib/constants'
import { isUuid } from '@/lib/form'
import { todayISO } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { createCase } from '../../practice-actions'

export default async function NewCasePage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const me = await requireRole('lawyer')
  const { client = '' } = await searchParams
  const supabase = await createClient()

  const { data } = await supabase.from('profiles').select('id, full_name, email')
    .eq('role', 'client').eq('lawyer_id', me.id).eq('is_active', true).order('full_name')
  const clients = (data ?? []) as { id: string; full_name: string | null; email: string }[]

  return (
    <>
      <PageHeader title="New case" back={{ href: '/lawyer/cases', label: 'All cases' }} />
      {clients.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-700">
            You need a client before you can open a case.{' '}
            <Link href="/lawyer/clients" className={linkCls}>Create a client first</Link>.
          </p>
        </Card>
      ) : (
        <Card>
          <ActionForm action={createCase} submitLabel="Create case" pendingLabel="Creating..." resetOnSuccess={false}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Client" name="client_id" required emptyLabel="Select a client"
                defaultValue={isUuid(client) ? client : ''}
                options={clients.map((c) => ({ value: c.id, label: c.full_name ? `${c.full_name} (${c.email})` : c.email }))}
              />
              <Field label="Case title" name="title" required placeholder="Short title for the matter" />
              <Select label="Case type" name="case_type" defaultValue="Other" options={CASE_TYPES.map((t) => ({ value: t, label: t }))} />
              <Select label="Status" name="status" defaultValue="open" options={CASE_STATUSES.map((s) => ({ value: s, label: CASE_STATUS_LABEL[s] }))} />
              <Field label="Court / forum" name="court" placeholder="Court or forum" />
              <Field label="Opposing party" name="opposing_party" />
              <Field label="Date opened" name="opened_on" type="date" defaultValue={todayISO()} />
            </div>
            <TextArea label="Case summary (visible to the client)" name="description" rows={4} />
          </ActionForm>
        </Card>
      )}
    </>
  )
}
