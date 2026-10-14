import { cardCls } from './ui'

export default function Card({
  title,
  action,
  children,
  padded = true,
  className = '',
}: {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
  padded?: boolean
  className?: string
}) {
  return (
    <section className={`${cardCls} overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
          <h2 className="text-sm font-semibold tracking-tight text-brand-900">{title}</h2>
          {action}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  )
}
