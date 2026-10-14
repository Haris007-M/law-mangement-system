import Link from 'next/link'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import { CaseStatusBadge } from '@/components/Badge'
import { linkCls, tdCls, thCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import type { CaseRow } from '@/lib/types'

export default async function ClientCasesPage() {
  const me = await requireRole('client')
  const supabase = await createClient()
  const { data } = await supabase.from('cases').select('*').eq('client_id', me.id).order('updated_at', { ascending: false })
  const cases = (data ?? []) as CaseRow[]

  return (
    <>
      <PageHeader title="My cases" description="Matters your lawyer is handling for you." />
      <Card padded={false}>
        {cases.length === 0 ? (
          <EmptyState title="No cases yet" hint="Your lawyer will open a case for you." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className={thCls}>Case</th>
                  <th className={thCls}>Type</th>
                  <th className={thCls}>Opened</th>
                  <th className={thCls}>Status</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className={tdCls}>
                      <Link href={`/client/cases/${c.id}`} className={linkCls}>{c.title}</Link>
                      <p className="text-xs text-slate-500">{c.case_number}</p>
                    </td>
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
