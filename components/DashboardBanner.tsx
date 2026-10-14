import Image from 'next/image'

// Hero banner at the top of each dashboard. Swap the picture by replacing the file in
// /public/images (banner-admin.jpg, banner-lawyer.jpg, banner-client.jpg), keeping the name.
export default function DashboardBanner({
  image,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  image: string
  eyebrow?: string
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <section className="relative mb-5 overflow-hidden sm:mb-8 rounded-2xl bg-brand-900 shadow-[0_12px_32px_-14px_rgba(15,23,42,0.55)] print:hidden">
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 960px, 100vw"
        className="object-cover object-right"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/75 to-brand-900/35 sm:from-brand-900 sm:via-brand-900/80 sm:to-brand-900/10" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-gold-500/70 via-gold-500/20 to-transparent" />
      <div className="relative flex min-h-[12rem] flex-col justify-end gap-5 p-6 sm:min-h-[14rem] sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">{eyebrow}</p>}
          <h1 className="mt-2 font-display text-[1.65rem] font-semibold leading-tight tracking-tight text-white sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-slate-300">{subtitle}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
      </div>
    </section>
  )
}

// e.g. "Tuesday 13 October", shown above the greeting
export function todayLabel(): string {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
}
