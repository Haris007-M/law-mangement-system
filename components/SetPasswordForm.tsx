'use client'

import { useActionState } from 'react'
import { updatePassword } from '@/app/actions/auth'
import FormMessage from './FormMessage'
import { buttonCls, inputCls, labelCls } from './ui'

export default function SetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined)

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="password" className={labelCls}>New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} maxLength={72} required className={inputCls} />
      </div>
      <div>
        <label htmlFor="confirm" className={labelCls}>Confirm password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} maxLength={72} required className={inputCls} />
      </div>
      <p className="text-xs text-slate-600">At least 10 characters, with a letter and a number.</p>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={`${buttonCls} w-full`}>
        {pending ? 'Saving...' : 'Save password'}
      </button>
    </form>
  )
}
