import Link from 'next/link'
import StatusPage from '@/components/StatusPage'
import { buttonCls, secondaryBtnCls } from '@/components/ui'

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="We could not find that page"
      message="The page may have been moved or deleted, or you may not have access to it. Check the address, or head back to your workspace."
    >
      <Link href="/" className={buttonCls}>Go to my workspace</Link>
      <Link href="/login" className={secondaryBtnCls}>Sign in</Link>
    </StatusPage>
  )
}
