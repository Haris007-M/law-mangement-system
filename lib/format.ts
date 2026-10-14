// Dates are stored and shown as UTC "wall clock" so what a lawyer types in the
// form is exactly what everyone sees, regardless of server or browser time zone.
export function formatDate(v: string | null | undefined): string {
  if (!v) return '—'
  const d = new Date(v.length === 10 ? `${v}T00:00:00Z` : v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function formatDateTime(v: string | null | undefined): string {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  })
}

export function formatTime(v: string): string {
  return new Date(v).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
}

export function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export const todayISO = () => new Date().toISOString().slice(0, 10)

// Sum cents per currency: { PKR: 1000, USD: 500 }
export function sumByCurrency(rows: { amount_cents: number; currency: string }[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of rows) out[r.currency] = (out[r.currency] ?? 0) + r.amount_cents
  return out
}

export function formatTotals(totals: Record<string, number>): string {
  const parts = Object.entries(totals).map(([cur, cents]) => formatMoney(cents, cur))
  return parts.length ? parts.join(' + ') : '—'
}
