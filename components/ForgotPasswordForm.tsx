'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { requestPasswordReset } from '@/app/actions/auth'
import FormMessage from './FormMessage'
import { buttonCls, inputCls, labelCls } from './ui'

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined)

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className={labelCls}>Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputCls} />
      </div>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={`${buttonCls} w-full`}>
        {pending ? 'Sending...' : 'Send reset link'}
      </button>
      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-brand-700 underline-offset-2 hover:text-brand-900 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}
