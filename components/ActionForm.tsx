'use client'

import { useActionState, useEffect, useRef, useTransition } from 'react'
import type { ActionState } from '@/lib/types'
import FormMessage from './FormMessage'
import { buttonCls } from './ui'

// Generic form for server actions.
// It submits via onSubmit (not the `action` prop) so React does NOT wipe the inputs
// when the server returns an error. On success the form is reset manually.
export default function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = 'Saving...',
  className = 'space-y-4',
  resetOnSuccess = true,
  buttonClassName,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  children: React.ReactNode
  submitLabel: string
  pendingLabel?: string
  className?: string
  resetOnSuccess?: boolean
  buttonClassName?: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const [, startTransition] = useTransition()
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success && resetOnSuccess) ref.current?.reset()
  }, [state, resetOnSuccess])

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        startTransition(() => {
          formAction(data)
        })
      }}
    >
      {children}
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={buttonClassName ?? buttonCls}>
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  )
}
