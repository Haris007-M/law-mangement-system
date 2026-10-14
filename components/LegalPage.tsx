import Link from 'next/link'
import { LEGAL } from '@/lib/brand'
import Logo from './Logo'

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/"><Logo size={30} /></Link>
          <nav className="flex gap-5 text-sm text-slate-600">
            <Link href="/terms" className="hover:text-brand-800">Terms</Link>
            <Link href="/privacy" className="hover:text-brand-800">Privacy</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {process.env.NODE_ENV !== 'production' && (
          <p className="mb-8 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-700">
            Template text (shown in development only). Set your company details in <code>.env.local</code> and have a
            qualified lawyer review this page before you launch.
          </p>
        )}
        <h1 className="font-display text-4xl font-semibold tracking-tight text-brand-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {LEGAL.updated}</p>
        <article className="mt-8 space-y-4 text-[15px] leading-7 text-slate-700 [&_a]:text-brand-700 [&_a]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-brand-900 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
          {children}
        </article>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} {LEGAL.company}. All rights reserved.
      </footer>
    </div>
  )
}
