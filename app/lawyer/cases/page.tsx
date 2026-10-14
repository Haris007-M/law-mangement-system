import Link from 'next/link'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import { CaseStatusBadge } from '@/components/Badge'
import { buttonCls, inputCls, linkCls, secondaryBtnCls, tdCls, thCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { CASE_STATUSES, CASE_STATUS_LABEL } from '@/lib/constants'
import { getNames, nameOf } from '@/lib/data'
import { formatDate } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import type { CaseRow } from '@/lib/types'

export default async function CasesPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const me = await requireRole('lawyer')
  const { q = '', status = '' } = await searchParams
  const supabase = await createClient()

  let query = supabase.from('cases').select('*').eq('lawyer_id', me.id).order('updated_at', { ascending: false }).limit(200)
  if ((CASE_STATUSES as readonly string[]).includes(status)) query = query.eq('status', status)
  const term = q.replace(/[,()%*\\]/g, ' ').trim().slice(0, 60)
  if (term) query = query.or(`title.ilike.%${term}%,case_number.ilike.%${term}%`)

  const { data } = await query
  const cases = (data ?? []) as CaseRow[]
  const names = await getNames(supabase, cases.map((c) => c.client_id))

  return (
    <>
      <PageHeader
        title="Cases"
        description="All matters you are handling."
        actions={<Link href="/lawyer/cases/new" className={buttonCls}>New case</Link>}
      />
      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search title or case number" className={`${inputCls} max-w-xs`} />
        <select name="status" defaultValue={status} className={`${inputCls} max-w-[11rem]`}>
          <option value="">All statuses</option>
          {CASE_STATUSES.map((s) => <option key={s} value={s}>{CASE_STATUS_LABEL[s]}</option>)}
        </select>
        <button type="submit" className={secondaryBtnCls}>Filter</button>
      </form>

      <Card padded={false}>
        {cases.length === 0 ? (
          <EmptyState title="No cases found" hint="Try different filters, or create a new case." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className={thCls}>Case</th>
                  <th className={thCls}>Client</th>
                  <th className={thCls}>Type</th>
                  <th className={thCls}>Opened</th>
                  <th className={thCls}>Status</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className={tdCls}>
                      <Link href={`/lawyer/cases/${c.id}`} className={linkCls}>{c.title}</Link>
                      <p className="text-xs text-slate-500">{c.case_number}</p>
                    </td>
                    <td className={tdCls}>{nameOf(names, c.client_id)}</td>
                    <td className={tdCls}>{c.case_type}</td>
                    <td className={tdCls}>{formatDate(c.opened_on)}</td>
                    <td className={tdCls}><CaseStatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
