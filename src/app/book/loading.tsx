import s from './Booking.module.css'

export default function BookLoading() {
  return (
    <div className={s.pageWrap}>
      <div className={`${s.listingCard} animate-pulse`}>
        <div className="w-20 h-20 rounded-full bg-black/10 mx-auto mb-4" />
        <div className="h-5 w-40 rounded bg-black/10 mx-auto mb-3" />
        <div className="h-4 w-64 rounded bg-black/10 mx-auto mb-6" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-black/5 mb-3" />
        ))}
      </div>
    </div>
  )
}