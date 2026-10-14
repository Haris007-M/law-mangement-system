import { logout } from '@/app/actions/auth'
import { ROLE_LABEL, type Profile } from '@/lib/types'
import { buttonCls } from './ui'

export default function Header({ profile }: { profile: Profile }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Law CRM</p>
          <p className="text-xs text-slate-600">
            {profile.full_name ?? profile.email} ({ROLE_LABEL[profile.role]})
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className={buttonCls}>Sign out</button>
        </form>
      </div>
    </header>
  )
}
