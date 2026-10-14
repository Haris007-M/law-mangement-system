'use client'

import { useActionState } from 'react'
import { verifyLoginMfa } from '@/app/actions/mfa'
import { logout } from '@/app/actions/auth'
import FormMessage from './FormMessage'
import { buttonCls, inputCls, labelCls } from './ui'

export default function MfaLoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(verifyLoginMfa, undefined)
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label htmlFor="code" className={labelCls}>Authentication code</label>
          <input
            id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*"
            maxLength={7} required autoFocus placeholder="123456"
            className={`${inputCls} text-center font-mono text-xl tracking-[0.35em]`}
          />
        </div>
        <FormMessage state={state} />
        <button type="submit" disabled={pending} className={`${buttonCls} w-full`}>
          {pending ? 'Verifying...' : 'Verify and sign in'}
        </button>
      </form>
      <form action={logout} className="text-center">
        <button type="submit" className="text-sm font-medium text-brand-700 underline-offset-2 hover:text-brand-900 hover:underline">
          Use a different account
        </button>
      </form>
    </div>
  )
}
