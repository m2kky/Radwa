import s from '../Booking.module.css'

export default function BookSlugLoading() {
  return (
    <div className={s.pageWrap}>
      <div className={`${s.bookingCard} animate-pulse`}>
        <div className="w-[340px] border-r border-black/10 p-6 space-y-4">
          <div className="h-16 w-16 rounded-full bg-black/10" />
          <div className="h-5 w-32 rounded bg-black/10" />
          <div className="h-7 w-48 rounded bg-black/10" />
          <div className="h-4 w-40 rounded bg-black/10" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <div className="h-7 w-64 rounded bg-black/10" />
          <div className="h-72 rounded-lg bg-black/5" />
        </div>
      </div>
    </div>
  )
}