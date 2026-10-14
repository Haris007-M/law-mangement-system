import type { Profile } from '@/lib/types'

export default function StatusBadge({ profile }: { profile: Profile }) {
  const [label, cls] = !profile.is_active
    ? ['Suspended', 'bg-alert-50 text-alert-700']
    : !profile.password_set_at
      ? ['Invited', 'bg-amber-50 text-amber-800']
      : ['Active', 'bg-green-50 text-green-700']

  return <span className={`rounded px-2 py-0.5 ${cls}`}>{label}</span>
}
