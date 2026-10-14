import Link from 'next/link'
import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import DashboardBanner, { todayLabel } from '@/components/DashboardBanner'
import StatCard from '@/components/StatCard'
import { AccountStatusBadge } from '@/components/Badge'
import { buttonCls, ghostOnDarkBtnCls, linkCls, tdCls, thCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { getNames, nameOf } from '@/lib/data'
import { formatBytes, formatDateTime } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

type Stats = {
  lawyers: number; active_lawyers: number; clients: number
  cases: number; open_cases: number; documents: number; storage_bytes: number
}

export default async function AdminDashboard() {
  const me = await requireRole('super_admin')
  const supabase = await createClient()

  const [statsRes, lawyersRes, auditRes, activityRes] = await Promise.all([
    supabase.rpc('admin_platform_stats').maybeSingle(),
    supabase.from('profiles').select('*').eq('role', 'lawyer').order('created_at', { ascending: false }).limit(5),
    supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(8),
    supabase.rpc('admin_weekly_activity', { p_weeks: 8 }), // aggregate counts only, never contents
  ])

  const stats = (statsRes.data as Stats | null) ?? {
    lawyers: 0, active_lawyers: 0, clients: 0, cases: 0, open_cases: 0, documents: 0, storage_bytes: 0,
  }
  const lawyers = (lawyersRes.data ?? []) as Profile[]
  const activity = (activityRes.data ?? []) as {
    new_lawyers: number; new_clients: number; new_cases: number; new_documents: number
  }[]
  const col = (k: 'new_lawyers' | 'new_clients' | 'new_cases' | 'new_documents') => activity.map((a) => Number(a[k]))
  const logs = (auditRes.data ?? []) as {
    id: number; actor_id: string | null; action: string; target_id: string | null; created_at: string
  }[]
  const names = await getNames(supabase, logs.flatMap((l) => [l.actor_id, l.target_id]))

  return (
    <>
      <DashboardBanner
        image="/images/banner-admin.jpg"
        eyebrow={todayLabel()}
        title={`Welcome back, ${me.full_name?.split(' ')[0] ?? 'admin'}`}
        subtitle="Platform overview. You manage accounts here; case contents stay private to each lawyer and client."
      >
        <Link href="/admin/lawyers" className={buttonCls}>Manage lawyers</Link>
        <Link href="/admin/audit" className={ghostOnDarkBtnCls}>Audit log</Link>
      </DashboardBanner>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Lawyers" value={stats.lawyers} hint={`${stats.active_lawyers} active`} series={col('new_lawyers')} caption="New · 8 wks" />
        <StatCard label="Clients" value={stats.clients} hint="Across all lawyers" series={col('new_clients')} caption="New · 8 wks" />
        <StatCard label="Cases" value={stats.cases} hint={`${stats.open_cases} open`} series={col('new_cases')} caption="Opened · 8 wks" />
        <StatCard label="Documents" value={stats.documents} hint={`${formatBytes(stats.storage_bytes)} stored`} series={col('new_documents')} chart="bars" caption="Uploaded · 8 wks" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Newest lawyers" padded={false} action={<Link href="/admin/lawyers" className={linkCls}>Manage</Link>}>
          {lawyers.length === 0 ? (
            <EmptyState title="No lawyers yet" hint="Create the first lawyer account." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {lawyers.map((l) => (
                <li key={l.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{l.full_name}</p>
                    <p className="truncate text-xs text-slate-500">{l.email}</p>
                  </div>
                  <AccountStatusBadge isActive={l.is_active} passwordSetAt={l.password_set_at} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent activity" padded={false} action={<Link href="/admin/audit" className={linkCls}>View all</Link>}>
          {logs.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr><th className={thCls}>Who</th><th className={thCls}>Action</th><th className={thCls}>When</th></tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-t border-slate-100">
                      <td className={tdCls}>{nameOf(names, l.actor_id)}</td>
                      <td className={tdCls}>{l.action}</td>
                      <td className={`${tdCls} whitespace-nowrap`}>{formatDateTime(l.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
