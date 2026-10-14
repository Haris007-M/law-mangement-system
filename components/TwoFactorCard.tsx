'use client'

import { useState, useTransition } from 'react'
import { ShieldCheck } from 'lucide-react'
import { beginMfaEnroll, confirmMfaEnroll, disableMfa } from '@/app/actions/mfa'
import ActionForm from './ActionForm'
import Card from './Card'
import { Badge } from './Badge'
import { buttonCls, dangerBtnCls, inputCls, labelCls } from './ui'

function CodeField({ id = 'code' }: { id?: string }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>6-digit code</label>
      <input
        id={id} name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*"
        maxLength={7} required placeholder="123456" className={`${inputCls} max-w-[11rem] text-center font-mono text-lg tracking-widest`}
      />
    </div>
  )
}

export default function TwoFactorCard({ enabled }: { enabled: boolean }) {
  const [setup, setSetup] = useState<{ factorId: string; qr: string; secret: string } | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [pending, startTransition] = useTransition()

  function start() {
    setError(undefined)
    startTransition(async () => {
      const res = await beginMfaEnroll()
      if (res.error || !res.factorId || !res.qr || !res.secret) {
        setError(res.error ?? 'Could not start the set-up.')
        return
      }
      setSetup({ factorId: res.factorId, qr: res.qr, secret: res.secret })
    })
  }

  return (
    <Card title="Two-factor authentication">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-medium text-slate-900">Authenticator app</p>
          <div className="mt-0.5">{enabled ? <Badge tone="green">On</Badge> : <Badge>Off</Badge>}</div>
        </div>
      </div>

      {enabled ? (
        <>
          <p className="mb-4 text-sm text-slate-600">
            Signing in needs your password and a code from your authenticator app. To turn it off, enter a current code.
          </p>
          <ActionForm action={disableMfa} submitLabel="Turn off two-factor" pendingLabel="Turning off..." buttonClassName={dangerBtnCls}>
            <CodeField id="disable-code" />
          </ActionForm>
        </>
      ) : setup ? (
        <div className="space-y-4">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>Open an authenticator app (Google Authenticator, Microsoft Authenticator, Authy, 1Password...).</li>
            <li>Scan this QR code, or type the key below into the app.</li>
            <li>Enter the 6-digit code the app shows to finish.</li>
          </ol>
          <div className="flex flex-wrap items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qr} alt="QR code for your authenticator app" width={168} height={168} className="rounded-lg border border-slate-200 bg-white p-2" />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Setup key</p>
              <p className="mt-1 break-all font-mono text-sm text-slate-900">{setup.secret}</p>
            </div>
          </div>
          <ActionForm action={confirmMfaEnroll} submitLabel="Verify and turn on" pendingLabel="Verifying..." resetOnSuccess>
            <input type="hidden" name="factor_id" value={setup.factorId} />
            <CodeField id="enroll-code" />
          </ActionForm>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-600">
            Add a second step to sign-in. Even if someone learns your password, they cannot get in without your phone.
            Strongly recommended for lawyers and administrators.
          </p>
          {error && <p role="alert" className="mb-3 rounded-lg border border-alert-200 bg-alert-50 px-3.5 py-2.5 text-sm text-alert-700">{error}</p>}
          <button type="button" onClick={start} disabled={pending} className={buttonCls}>
            {pending ? 'Preparing...' : 'Set up two-factor'}
          </button>
        </>
      )}
    </Card>
  )
}
