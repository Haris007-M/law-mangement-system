import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import { tdCls, thCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { getNames, nameOf } from '@/lib/data'
import { formatDateTime } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'

type Log = {
  id: number; actor_id: string | null; action: string; target_id: string | null
  meta: Record<string, unknown>; created_at: string
}

export default async function AuditPage() {
  await requireRole('super_admin')
  const supabase = await createClient()
  const { data } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(300)
  const logs = (data ?? []) as Log[]
  const names = await getNames(supabase, logs.flatMap((l) => [l.actor_id, l.target_id]))

  return (
    <>
      <PageHeader title="Audit log" description="Append-only record of sensitive actions across the platform (latest 300)." />
      <Card padded={false}>
        {logs.length === 0 ? (
          <EmptyState title="Nothing recorded yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className={thCls}>When (UTC)</th>
                  <th className={thCls}>Who</th>
                  <th className={thCls}>Action</th>
                  <th className={thCls}>Target</th>
                  <th className={thCls}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100 align-top">
                    <td className={`${tdCls} whitespace-nowrap`}>{formatDateTime(l.created_at)}</td>
                    <td className={tdCls}>{nameOf(names, l.actor_id)}</td>
                    <td className={`${tdCls} font-mono text-xs`}>{l.action}</td>
                    <td className={tdCls}>{l.target_id && names[l.target_id] ? nameOf(names, l.target_id) : l.target_id ? l.target_id.slice(0, 8) : '—'}</td>
                    <td className={`${tdCls} max-w-xs truncate text-xs text-slate-500`}>
                      {Object.keys(l.meta ?? {}).length ? JSON.stringify(l.meta) : '—'}
                    </td>
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
