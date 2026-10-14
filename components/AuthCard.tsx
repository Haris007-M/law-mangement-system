import Image from 'next/image'
import Link from 'next/link'
import { Lock, ShieldCheck, Users } from 'lucide-react'
import { BRAND } from '@/lib/brand'
import Logo from './Logo'

const POINTS = [
  { icon: Lock, text: 'Private by design: your matters stay between you and your client.' },
  { icon: Users, text: 'A dedicated portal for every client, with only what you choose to share.' },
  { icon: ShieldCheck, text: 'Rate-limited sign-in, audit trail and encrypted storage.' },
]

export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* brand panel (desktop) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-900 p-12 text-white lg:flex">
        <Image src="/images/hero.jpg" alt="" fill priority sizes="55vw" className="object-cover object-right" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/95 via-brand-900/80 to-brand-900/50" />
        <Link href="/" className="relative">
          <Logo size={42} tone="light" />
        </Link>

        <div className="relative">
          <h2 className="max-w-md font-display text-4xl font-semibold leading-tight tracking-tight">
            Practice, <span className="text-gold-400">organised.</span>
            <br />
            Clients, <span className="text-gold-400">informed.</span>
          </h2>
          <ul className="mt-10 max-w-md space-y-5">
            {POINTS.map((p) => (
              <li key={p.text} className="flex gap-3.5 text-sm leading-relaxed text-slate-300">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-gold-400">
                  <p.icon className="h-4 w-4" />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-400">© {new Date().getFullYear()} {BRAND.name}. Invitation-only workspace.</p>
      </aside>

      {/* form side */}
      <div className="flex flex-col items-center justify-center bg-canvas px-6 py-12">
        <Link href="/" className="mb-8 lg:hidden">
          <Logo size={40} />
        </Link>
        <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.20)]">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-brand-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Secure, private and invitation-only. <Link href="/terms" className="underline hover:text-slate-700">Terms</Link> ·{' '}
          <Link href="/privacy" className="underline hover:text-slate-700">Privacy</Link>
        </p>
      </div>
    </main>
  )
}
