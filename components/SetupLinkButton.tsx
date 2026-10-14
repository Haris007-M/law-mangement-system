'use client'

import { useActionState } from 'react'
import type { ActionState } from '@/lib/types'
import LinkPanel from './LinkPanel'

export default function SetupLinkButton({
  action,
  id,
  label,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  id: string
  label: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="inline-block w-full max-w-sm text-right">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium text-brand-700 underline-offset-2 hover:text-brand-900 hover:underline disabled:opacity-60"
      >
        {pending ? 'Working...' : label}
      </button>
      {state?.error && (
        <p role="alert" className="mt-2 rounded-lg bg-alert-50 px-2.5 py-1.5 text-left text-xs text-alert-700">
          {state.error}
        </p>
      )}
      {state?.success && !state.link && (
        <p role="status" className="mt-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-left text-xs text-emerald-800">
          {state.success}
        </p>
      )}
      {state?.link && <LinkPanel link={state.link} />}
    </form>
  )
}
