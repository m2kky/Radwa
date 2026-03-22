export default function HomeLoading() {
  return (
    <div className="min-h-screen w-full animate-pulse">
      <section className="h-[70vh] bg-cold-dark/40" />
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="h-8 w-56 rounded bg-white/10 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white/5 border border-white/10" />
          ))}
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="h-8 w-40 rounded bg-white/10 mb-6" />
        <div className="h-72 rounded-3xl bg-white/5 border border-white/10" />
      </section>
    </div>
  )
}