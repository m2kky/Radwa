export default function BlogPostLoading() {
  return (
    <main className="min-h-screen pt-32 pb-20 animate-pulse">
      <article className="max-w-3xl mx-auto px-6 space-y-6">
        <div className="h-4 w-24 rounded bg-white/10" />
        <div className="h-14 w-5/6 rounded bg-white/10" />
        <div className="h-4 w-48 rounded bg-white/10" />
        <div className="h-80 rounded-2xl bg-white/5 border border-white/10" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-white/10" />
          ))}
        </div>
      </article>
    </main>
  )
}