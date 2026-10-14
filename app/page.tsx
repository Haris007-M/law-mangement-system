import Image from 'next/image'
import Link from 'next/link'
import {
  Briefcase, CalendarDays, Check, Lock, MessageSquare, Receipt, ShieldCheck, Users,
} from 'lucide-react'
import Logo from '@/components/Logo'
import { BRAND } from '@/lib/brand'
import { ghostOnDarkBtnCls, goldBtnCls } from '@/components/ui'

const FEATURES = [
  { icon: Briefcase, title: 'Case management', text: 'Every matter in one place: parties, court, status, deadlines, notes and history.' },
  { icon: Users, title: 'Client portal', text: 'Give each client a private login to follow progress, send documents and message you.' },
  { icon: Lock, title: 'Private document vault', text: 'Files sit in a private store and open only through short-lived, permission-checked links.' },
  { icon: CalendarDays, title: 'Calendar and tasks', text: 'Hearings, meetings and deadlines, with overdue work flagged. Share chosen dates with clients.' },
  { icon: Receipt, title: 'Billing and invoices', text: 'Create invoices, track payments, and print clean PDFs carrying your firm name.' },
  { icon: MessageSquare, title: 'Case messaging', text: 'One conversation per case replaces scattered email and chat threads.' },
]

const ROLES = [
  { name: 'Platform administrator', tag: 'Runs the platform', points: ['Creates and suspends lawyer accounts', 'Sees usage totals at a glance', 'Full audit trail of actions', 'Can never read case contents'] },
  { name: 'Lawyer', tag: 'Runs the practice', points: ['Manages their own clients and cases', 'Documents, tasks, calendar, billing', 'Private notes no one else can see', 'Controls what each client sees'] },
  { name: 'Client', tag: 'Stays informed', points: ['Sees only their own cases', 'Reads what the lawyer shares', 'Sends documents and messages', 'Views and prints invoices'] },
]

export default function Home() {
  return (
    <div className="min-h-dvh bg-canvas text-slate-900">
      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <Image src="/images/hero.jpg" alt="" fill priority sizes="100vw" className="object-cover object-right" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900 via-brand-900/85 to-brand-900/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/60 to-transparent" />

        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Logo size={40} tone="light" />
          <Link href="/login" className={ghostOnDarkBtnCls}>Sign in</Link>
        </header>

        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-12 sm:pb-36 sm:pt-28">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-gold-300 ring-1 ring-white/15 backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" /> Built for law firms. Confidential by design.
          </p>
          <h1 className="max-w-2xl font-display text-[2rem] font-semibold leading-[1.12] tracking-tight sm:text-6xl">
            Run your practice with <span className="text-gold-400">clarity</span>, and your clients with <span className="text-gold-400">confidence</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:mt-6 sm:text-lg">
            {BRAND.tagline}. Cases, documents, deadlines and billing in one secure workspace, with a private portal for every client.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/login" className={goldBtnCls}>Sign in to your workspace</Link>
            <a href="#features" className={`${ghostOnDarkBtnCls} px-6 py-3 text-base`}>See what is inside</a>
          </div>
          <p className="mt-5 text-sm text-slate-400">Invitation-only. Accounts are created by your administrator.</p>
        </div>
      </section>

      {/* ---------- features ---------- */}
      <section id="features" className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Features</p>
          <h2 className="mt-2 text-center font-display text-3xl font-semibold tracking-tight text-brand-900">Everything a practice needs</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 text-gold-700 transition group-hover:bg-gold-500 group-hover:text-brand-900"><f.icon className="h-5 w-5" /></span>
                <h3 className="mt-5 text-base font-semibold text-brand-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- roles ---------- */}
      <section className="mx-auto max-w-6xl px-6 pb-14 sm:pb-20">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Access control</p>
        <h2 className="mt-2 text-center font-display text-3xl font-semibold tracking-tight text-brand-900">The right access for every role</h2>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.name} className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">{r.tag}</p>
              <h3 className="mt-1 font-display text-xl font-semibold text-brand-900">{r.name}</h3>
              <ul className="mt-5 space-y-3 text-sm text-slate-600">
                {r.points.map((p) => (
                  <li key={p} className="flex gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700"><Check className="h-3 w-3" /></span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- security ---------- */}
      <section className="relative overflow-hidden bg-brand-900 py-20 text-white">
        <Image src="/images/banner-client.jpg" alt="" fill sizes="100vw" className="object-cover object-right opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900 via-brand-900/85 to-brand-900/30" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="max-w-xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-gold-400 ring-1 ring-white/15"><ShieldCheck className="h-6 w-6" /></span>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight">Confidentiality is built in, not bolted on</h2>
            <p className="mt-4 leading-relaxed text-slate-300">
              Access rules are enforced by the database itself: one lawyer can never see another&apos;s clients, and clients see only what their lawyer shares.
              Sign-ins are rate limited, two-factor authentication is available, and sensitive actions are written to an audit log.
            </p>
            <Link href="/login" className={`${goldBtnCls} mt-8`}>Sign in</Link>
          </div>
        </div>
      </section>

      <footer className="bg-brand-900 py-8 text-center text-sm text-slate-400">
        <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
        <p className="mt-2 space-x-4">
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
        </p>
      </footer>
    </div>
  )
}
