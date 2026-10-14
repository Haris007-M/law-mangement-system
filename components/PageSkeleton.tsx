// Placeholder shown while a portal page loads (keeps the sidebar, replaces only the content).
export default function PageSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="mb-8">
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-200/70" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-slate-200/80 bg-white" />
        ))}
      </div>
      <div className="mt-6 h-72 rounded-2xl border border-slate-200/80 bg-white" />
    </div>
  )
}
