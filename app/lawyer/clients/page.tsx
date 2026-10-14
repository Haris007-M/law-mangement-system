import Link from 'next/link'
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
import { inviteClient, resendClientInvite, resetClientTwoFactor, setClientActive } from '../actions'

export default async function ClientsPage() {
  const me = await requireRole('lawyer')
  const supabase = await createClient()
  const inviteLabel = mailConfigured() ? 'Resend invite email' : 'Get setup link'

  const [{ data }, { data: caseData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'client').eq('lawyer_id', me.id).order('created_at', { ascending: false }),
    supabase.from('cases').select('client_id').eq('lawyer_id', me.id),
  ])
  const clients = (data ?? []) as Profile[]
  const caseCount: Record<string, number> = {}
  for (const c of (caseData ?? []) as { client_id: string }[]) caseCount[c.client_id] = (caseCount[c.client_id] ?? 0) + 1

  return (
    <>
      <PageHeader title="Clients" description="Create client accounts so they can follow their cases, share documents and message you." />
      <div className="space-y-6">
        <InviteForm action={inviteClient} heading="Create a client account" buttonLabel="Create client" />

        <Card title={`Your clients (${clients.length})`} padded={false}>
          {clients.length === 0 ? (
            <EmptyState title="No clients yet" hint="Create your first client above." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={thCls}>Client</th>
                    <th className={thCls}>Cases</th>
                    <th className={thCls}>Added</th>
                    <th className={thCls}>Status</th>
                    <th className={thCls} />
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100 align-top">
                      <td className={tdCls}>
                        <Link href={`/lawyer/clients/${c.id}`} className={linkCls}>{c.full_name}</Link>
                        <p className="text-xs text-slate-500">{c.email}</p>
                      </td>
                      <td className={tdCls}>{caseCount[c.id] ?? 0}</td>
                      <td className={tdCls}>{formatDate(c.created_at)}</td>
                      <td className={tdCls}><AccountStatusBadge isActive={c.is_active} passwordSetAt={c.password_set_at} mfaEnabled={c.mfa_enabled} /></td>
                      <td className={`${tdCls} text-right`}>
                        <div className="flex flex-col items-end gap-2">
                          {!c.password_set_at && c.is_active && (
                            <SetupLinkButton action={resendClientInvite} id={c.id} label={inviteLabel} />
                          )}
                          {c.mfa_enabled && (
                            <form action={resetClientTwoFactor}>
                              <input type="hidden" name="id" value={c.id} />
                              <ConfirmButton message="Remove this client's two-factor setup? Use this only if they lost their phone." className={linkCls}>Reset 2FA</ConfirmButton>
                            </form>
                          )}
                          <form action={setClientActive}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="active" value={String(!c.is_active)} />
                            <button type="submit" className={c.is_active ? dangerLinkCls : linkCls}>
                              {c.is_active ? 'Suspend' : 'Reactivate'}
                            </button>
                          </form>
                        </div>
                      </td>
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
