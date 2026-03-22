export default function BlogLoading() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 animate-pulse">
      <div className="max-w-7xl mx-auto">
        <div className="h-4 w-20 rounded bg-white/10 mb-4" />
        <div className="h-14 w-80 rounded bg-white/10 mb-12" />
        <div className="h-80 rounded-2xl bg-white/5 border border-white/10 mb-10" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-white/5 border border-white/10" />
          ))}
        </div>
      </div>
    </main>
  )
}