export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas" role="status" aria-label="Loading">
      <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-100 border-t-gold-400" />
    </div>
  )
}
