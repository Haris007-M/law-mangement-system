'use client'

import { useActionState } from 'react'
import type { ActionState } from '@/lib/types'
import FormMessage from './FormMessage'
import LinkPanel from './LinkPanel'
import { buttonCls, cardCls, inputCls, labelCls } from './ui'

export default function InviteForm({
  action,
  heading,
  buttonLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  heading: string
  buttonLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  // React 19 clears uncontrolled forms after every action. On an error we echo the
  // values back via defaultValue so nothing the user typed is lost; on success the
  // state has no fields, so the form ends up empty for the next invite.
  return (
    <form action={formAction} className={`${cardCls} p-5`}>
      <h2 className="text-sm font-semibold tracking-tight text-brand-900">{heading}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className={labelCls}>Full name</label>
          <input
            id="full_name"
            name="full_name"
            required
            defaultValue={state?.fields?.full_name}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="invite_email" className={labelCls}>Email</label>
          <input
            id="invite_email"
            name="email"
            type="email"
            required
            defaultValue={state?.fields?.email}
            className={inputCls}
          />
        </div>
      </div>
      <div className="mt-3 space-y-3">
        <FormMessage state={state} />
        {state?.link && <LinkPanel link={state.link} />}
        <button type="submit" disabled={pending} className={buttonCls}>
          {pending ? 'Creating...' : buttonLabel}
        </button>
      </div>
    </form>
  )
}
