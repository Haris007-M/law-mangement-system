import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import { AccountStatusBadge } from '@/components/Badge'
import { inputCls, secondaryBtnCls, tdCls, thCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { getNames, nameOf } from '@/lib/data'
import { formatDate } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

export default async function AdminClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireRole('super_admin')
  const { q = '' } = await searchParams
  const supabase = await createClient()

  let query = supabase.from('profiles').select('*').eq('role', 'client').order('created_at', { ascending: false }).limit(300)
  const term = q.replace(/[,()%*\\]/g, ' ').trim().slice(0, 60)
  if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)

  const { data } = await query
  const clients = (data ?? []) as Profile[]
  const names = await getNames(supabase, clients.map((c) => c.lawyer_id))

  return (
    <>
      <PageHeader
        title="Clients"
        description="Account directory only. Case details, messages and documents are confidential between lawyer and client."
      />
      <form method="get" className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search by name or email" className={`${inputCls} max-w-sm`} />
        <button type="submit" className={secondaryBtnCls}>Search</button>
      </form>
      <Card title={`Clients (${clients.length})`} padded={false}>
        {clients.length === 0 ? (
          <EmptyState title="No clients found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className={thCls}>Client</th>
                  <th className={thCls}>Lawyer</th>
                  <th className={thCls}>Joined</th>
                  <th className={thCls}>Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className={tdCls}>
                      <p className="font-medium text-slate-900">{c.full_name}</p>
                      <p className="text-xs text-slate-500">{c.email}</p>
                    </td>
                    <td className={tdCls}>{nameOf(names, c.lawyer_id)}</td>
                    <td className={tdCls}>{formatDate(c.created_at)}</td>
                    <td className={tdCls}><AccountStatusBadge isActive={c.is_active} passwordSetAt={c.password_set_at} /></td>
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
