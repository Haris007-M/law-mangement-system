import { Inbox } from 'lucide-react'

export default function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center px-5 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-400">
        <Inbox className="h-6 w-6" />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-sm text-slate-500">{hint}</p>}
    </div>
  )
}
