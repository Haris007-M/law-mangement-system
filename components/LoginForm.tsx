'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import FormMessage from './FormMessage'
import { buttonCls, inputCls, labelCls } from './ui'

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className={labelCls}>Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.fields?.email} className={inputCls} />
      </div>
      <div>
        <label htmlFor="password" className={labelCls}>Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputCls} />
      </div>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={`${buttonCls} w-full`}>
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
      <p className="text-center text-sm">
        <Link href="/forgot-password" className="font-medium text-brand-700 underline-offset-2 hover:text-brand-900 hover:underline">
          Forgot your password?
        </Link>
      </p>
    </form>
  )
}
