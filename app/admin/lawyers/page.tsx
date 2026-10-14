import Card from '@/components/Card'
import EmptyState from '@/components/EmptyState'
import InviteForm from '@/components/InviteForm'
import PageHeader from '@/components/PageHeader'
import SetupLinkButton from '@/components/SetupLinkButton'
import { AccountStatusBadge } from '@/components/Badge'
import { dangerLinkCls, linkCls, tdCls, thCls } from '@/components/ui'
import { requireRole } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { mailConfigured } from '@/lib/mail'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'
import ConfirmButton from '@/components/ConfirmButton'
import { inviteLawyer, resendLawyerInvite, resetLawyerTwoFactor, setLawyerActive } from '../actions'

type LawyerStat = { lawyer_id: string; client_count: number; case_count: number; open_case_count: number }

export default async function LawyersPage() {
  await requireRole('super_admin')
  const supabase = await createClient()
  const inviteLabel = mailConfigured() ? 'Resend invite email' : 'Get setup link'

  const [{ data }, { data: statData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'lawyer').order('created_at', { ascending: false }),
    supabase.rpc('admin_lawyer_stats'),
  ])
  const lawyers = (data ?? []) as Profile[]
  const stats = new Map(((statData ?? []) as LawyerStat[]).map((s) => [s.lawyer_id, s]))

  return (
    <>
      <PageHeader title="Lawyers" description="Create lawyer accounts and control who has access." />
      <div className="space-y-6">
        <InviteForm action={inviteLawyer} heading="Create a lawyer account" buttonLabel="Create lawyer" />

        <Card title={`All lawyers (${lawyers.length})`} padded={false}>
          {lawyers.length === 0 ? (
            <EmptyState title="No lawyers yet" hint="Create the first one above." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={thCls}>Lawyer</th>
                    <th className={thCls}>Clients</th>
                    <th className={thCls}>Cases</th>
                    <th className={thCls}>Joined</th>
                    <th className={thCls}>Status</th>
                    <th className={thCls} />
                  </tr>
                </thead>
                <tbody>
                  {lawyers.map((l) => {
                    const s = stats.get(l.id)
                    return (
                      <tr key={l.id} className="border-t border-slate-100 align-top">
                        <td className={tdCls}>
                          <p className="font-medium text-slate-900">{l.full_name}</p>
                          <p className="text-xs text-slate-500">{l.email}</p>
                        </td>
                        <td className={tdCls}>{s?.client_count ?? 0}</td>
                        <td className={tdCls}>{s?.case_count ?? 0} <span className="text-xs text-slate-500">({s?.open_case_count ?? 0} open)</span></td>
                        <td className={tdCls}>{formatDate(l.created_at)}</td>
                        <td className={tdCls}><AccountStatusBadge isActive={l.is_active} passwordSetAt={l.password_set_at} mfaEnabled={l.mfa_enabled} /></td>
                        <td className={`${tdCls} text-right`}>
                          <div className="flex flex-col items-end gap-2">
                            {!l.password_set_at && l.is_active && (
                              <SetupLinkButton action={resendLawyerInvite} id={l.id} label={inviteLabel} />
                            )}
                            {l.mfa_enabled && (
                              <form action={resetLawyerTwoFactor}>
                                <input type="hidden" name="id" value={l.id} />
                                <ConfirmButton message="Remove this lawyer's two-factor setup? Use this only if they lost their phone." className={linkCls}>Reset 2FA</ConfirmButton>
                              </form>
                            )}
                            <form action={setLawyerActive}>
                              <input type="hidden" name="id" value={l.id} />
                              <input type="hidden" name="active" value={String(!l.is_active)} />
                              <button type="submit" className={l.is_active ? dangerLinkCls : linkCls}>
                                {l.is_active ? 'Suspend' : 'Reactivate'}
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <p className="text-xs text-slate-500">
          Suspending a lawyer also blocks all of their clients until the lawyer is reactivated.
        </p>
      </div>
    </>
  )
}
