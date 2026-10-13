/** Shown instantly while an admin page loads, so taps never feel ignored. */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="mb-2 h-8 w-56 bg-cream/[0.06]" />
      <div className="mb-8 h-4 w-80 max-w-full bg-cream/[0.04]" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-20 border border-gold/10 bg-ink" />)}
      </div>
      <div className="divide-y divide-gold/10 border border-gold/10 bg-ink">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="h-14 w-14 shrink-0 bg-cream/[0.05]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-gold/10" />
              <div className="h-4 w-2/3 bg-cream/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
