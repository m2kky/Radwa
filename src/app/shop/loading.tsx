export default function ShopLoading() {
  return (
    <main className="min-h-screen bg-background animate-pulse">
      <div className="container mx-auto px-4 py-20">
        <div className="h-10 w-72 rounded bg-white/10 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="h-40 rounded-xl bg-white/5" />
              <div className="h-5 w-2/3 rounded bg-white/10" />
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="h-4 w-1/2 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}