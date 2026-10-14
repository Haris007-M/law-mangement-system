'use client'

import { useState } from 'react'
import { buttonCls } from './ui'

// Shows a one-time setup link with a copy button.
export default function LinkPanel({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the field selects on focus so it can be copied by hand.
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-gold-200 bg-gold-50 p-3.5 text-left">
      <p className="text-xs text-gold-700">
        Email delivery is not set up (or failed), so send this one-time link to the person yourself.
        It expires after the Supabase email OTP expiry (1 hour by default). Treat it like a password.
      </p>
      <div className="mt-2 flex gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-md border border-gold-300 bg-white px-2 py-1 text-xs text-slate-800"
        />
        <button type="button" onClick={copy} className={buttonCls}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
