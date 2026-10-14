import Link from 'next/link'

export default function TabNav({
  base,
  tabs,
  active,
}: {
  base: string
  tabs: { key: string; label: string }[]
  active: string
}) {
  return (
    <div className="no-scrollbar overflow-x-auto border-b border-slate-200">
      <nav className="-mb-px flex gap-7">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`${base}?tab=${t.key}`}
            aria-current={t.key === active ? 'page' : undefined}
            className={`whitespace-nowrap border-b-2 px-0.5 pb-3 text-sm font-medium transition ${
              t.key === active
                ? 'border-gold-400 text-brand-900'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
