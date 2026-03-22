export default function ProductLoading() {
  return (
    <main className="min-h-screen bg-background animate-pulse">
      <div className="container mx-auto px-4 py-20 grid lg:grid-cols-2 gap-10">
        <div className="h-[420px] rounded-2xl border border-border bg-white/5" />
        <div className="space-y-5">
          <div className="h-6 w-24 rounded bg-white/10" />
          <div className="h-12 w-3/4 rounded bg-white/10" />
          <div className="h-6 w-1/2 rounded bg-white/10" />
          <div className="h-40 rounded-2xl border border-border bg-white/5" />
          <div className="h-14 rounded-xl bg-primary/30" />
        </div>
      </div>
    </main>
  )
}