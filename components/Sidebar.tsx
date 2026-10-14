'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Briefcase, CalendarDays, Ellipsis, FileText, LayoutDashboard, ListChecks, LogOut,
  Receipt, ScrollText, Settings, ShieldCheck, Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import type { NavIcon, NavItem } from '@/lib/nav'
import Logo from './Logo'

const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  lawyers: ShieldCheck,
  clients: Users,
  audit: ScrollText,
  settings: Settings,
  cases: Briefcase,
  calendar: CalendarDays,
  tasks: ListChecks,
  documents: FileText,
  billing: Receipt,
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
}

// Desktop (lg+): fixed sidebar.
// Phones and tablets: app-style top bar + bottom tab bar, with a slide-up menu for the rest.
export default function Sidebar({
  items,
  name,
  email,
  roleLabel,
}: {
  items: NavItem[]
  name: string
  email: string
  roleLabel: string
}) {
  const pathname = usePathname()
  const [sheet, setSheet] = useState(false)

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/')

  const primary = items.filter((i) => i.primary)
  const extras = items.filter((i) => !i.primary)
  const moreActive = extras.some(isActive)
  const tabCount = primary.length + (extras.length > 0 ? 1 : 0)

  // lock page scroll behind the sheet; Escape closes it
  useEffect(() => {
    if (!sheet) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [sheet])

  return (
    <>
      {/* ================= desktop sidebar ================= */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col bg-brand-900 text-slate-300 shadow-xl lg:flex print:hidden">
        <div className="flex h-16 items-center px-5">
          <Logo size={38} tone="light" />
        </div>

        <p className="px-6 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{roleLabel}</p>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {items.map((item) => {
            const Icon = ICONS[item.icon]
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {active && <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-gold-500" />}
                <Icon className={`h-[18px] w-[18px] transition-colors ${active ? 'text-gold-400' : 'text-slate-500 group-hover:text-slate-200'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="m-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500 text-sm font-semibold text-brand-900">
              {initials(name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{name}</p>
              <p className="truncate text-xs text-slate-400">{email}</p>
            </div>
          </div>
          <form action={logout} className="mt-3">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ================= mobile top bar ================= */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-[calc(3.5rem_+_env(safe-area-inset-top))] items-center justify-between border-b border-slate-200 bg-white/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden print:hidden">
        <Link href={items[0]?.href ?? '/'} aria-label="Home">
          <Logo size={30} />
        </Link>
        <button
          type="button"
          onClick={() => setSheet(true)}
          aria-label="Account menu"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-sm font-semibold text-brand-900 shadow-sm ring-2 ring-white"
        >
          {initials(name)}
        </button>
      </header>

      {/* ================= mobile bottom tab bar ================= */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden print:hidden"
      >
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}>
          {primary.map((item) => {
            const Icon = ICONS[item.icon]
            const active = isActive(item)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSheet(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors ${
                    active ? 'text-brand-900' : 'text-slate-500 active:text-slate-800'
                  }`}
                >
                  {active && <span className="absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-gold-500" />}
                  <Icon className={`h-[22px] w-[22px] ${active ? 'text-gold-600' : ''}`} />
                  <span className="max-w-full truncate">{item.short ?? item.label}</span>
                </Link>
              </li>
            )
          })}
          {extras.length > 0 && (
            <li>
              <button
                type="button"
                onClick={() => setSheet(true)}
                aria-haspopup="dialog"
                className={`relative flex min-h-[3.5rem] w-full flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors ${
                  moreActive ? 'text-brand-900' : 'text-slate-500 active:text-slate-800'
                }`}
              >
                {moreActive && <span className="absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-gold-500" />}
                <Ellipsis className={`h-[22px] w-[22px] ${moreActive ? 'text-gold-600' : ''}`} />
                <span>More</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* ================= slide-up menu (More + account) ================= */}
      {sheet && (
        <div className="fixed inset-0 z-40 lg:hidden print:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={() => setSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] animate-[sheet-up_220ms_ease-out] overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem_+_env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300" />

            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-500 text-base font-semibold text-brand-900">
                {initials(name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-brand-900">{name}</p>
                <p className="truncate text-sm text-slate-500">{roleLabel} · {email}</p>
              </div>
            </div>

            {extras.length > 0 && (
              <div className="mt-5 grid grid-cols-3 gap-3">
                {extras.map((item) => {
                  const Icon = ICONS[item.icon]
                  const active = isActive(item)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSheet(false)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center text-sm font-medium transition active:scale-[0.98] ${
                        active ? 'border-gold-300 bg-gold-50 text-brand-900' : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${active ? 'text-gold-600' : 'text-slate-500'}`} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}

            <form action={logout} className="mt-5">
              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-alert-700 transition active:bg-alert-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
