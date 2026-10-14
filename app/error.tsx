'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import StatusPage from '@/components/StatusPage'
import { buttonCls, secondaryBtnCls } from '@/components/ui'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <StatusPage
      code="500"
      title="Something went wrong"
      message="An unexpected error occurred. Your data is safe. Please try again, and contact support if it keeps happening."
    >
      <button type="button" onClick={reset} className={buttonCls}>Try again</button>
      <Link href="/" className={secondaryBtnCls}>Go home</Link>
      {error.digest && <p className="w-full text-xs text-slate-400">Reference: {error.digest}</p>}
    </StatusPage>
  )
}
