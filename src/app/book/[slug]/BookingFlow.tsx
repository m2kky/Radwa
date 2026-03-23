'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getAvailableSlots, submitBooking } from '@/app/api/bookings/actions'
import { trackEvent } from '@/lib/analytics'
import s from '../Booking.module.css'

interface EventType {
  id: string
  title: string
  slug: string
  description: string
  duration_minutes: number
  price: number
  color: string
  start_time_increment: number
  allow_guests: boolean
  invitee_questions: InviteeQuestion[]
  communication_methods: string[]
  timezone_display: string
  locked_timezone: string
  min_notice_hours: number
  max_future_days: number
}

type InviteeQuestion = {
  text: string
  required: boolean
  answer_type: string
  status: boolean
}

interface Profile {
  name: string
  welcome_message: string
  avatar_url: string
  time_format: string
  timezone: string
}

const MONTHS_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

function formatTime(time: string, format: string = '12h') {
  const [hours, minutes] = time.split(':').map(Number)
  if (format === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const ampm = hours >= 12 ? 'م' : 'ص'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
}

function addMinutes(time: string, mins: number): string {
  const [hours, minutes] = time.split(':').map(Number)
  const total = hours * 60 + minutes + mins
  return `${Math.floor(total / 60)
    .toString()
    .padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`
}

export default function BookingFlow({
  eventType,
  profile,
  notice,
}: {
  eventType: EventType
  profile: Profile
  notice?: string | null
}) {
  const event = eventType
  const userProfile = profile

  const [step, setStep] = useState<'calendar' | 'details' | 'success'>('calendar')
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card')
  const [showGuests, setShowGuests] = useState(false)

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + (event.max_future_days || 60))

    const days: { day: number; available: boolean }[] = []
    for (let index = 0; index < firstDay; index += 1) {
      days.push({ day: 0, available: false })
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day)
      const isFuture = date >= today && date <= maxDate
      days.push({ day, available: isFuture })
    }
    return days
  }, [month, year, event.max_future_days])

  useEffect(() => {
    if (!selectedDate) return

    setSlotsLoading(true)
    setSlots([])
    setSelectedTime('')

    getAvailableSlots(selectedDate, event.duration_minutes, event.id)
      .then((result) => {
        setSlots(result)
      })
      .catch(() => {
        setSlots([])
      })
      .finally(() => {
        setSlotsLoading(false)
      })
  }, [selectedDate, event.duration_minutes, event.id])

  const selectedDateObj = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null
  const activeQuestions = (event.invitee_questions || []).filter((question) => question.status)
  const isPaid = Number(event.price || 0) > 0

  const selectDate = (day: number) => {
    const value = `${year}-${(month + 1).toString().padStart(2, '0')}-${day
      .toString()
      .padStart(2, '0')}`
    setSelectedDate(value)
  }

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear((current) => current - 1)
    } else {
      setMonth((current) => current - 1)
    }
  }

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear((current) => current + 1)
    } else {
      setMonth((current) => current + 1)
    }
  }

  const handleSubmit = async (eventForm: React.FormEvent<HTMLFormElement>) => {
    eventForm.preventDefault()
    setSubmitting(true)
    setError('')

    const formData = new FormData(eventForm.currentTarget)
    formData.set('event_type_id', event.id)
    formData.set('date', selectedDate)
    formData.set('time', selectedTime)
    formData.set('duration_minutes', String(event.duration_minutes))
    formData.set('payment_method', paymentMethod)

    const firstName = String(formData.get('first_name') ?? '').trim()
    const lastName = String(formData.get('last_name') ?? '').trim()
    const fullName = [firstName, lastName].filter(Boolean).join(' ')
    if (fullName) formData.set('name', fullName)

    const response = await submitBooking(formData)
    setSubmitting(false)

    if (response?.error) {
      setError(response.error)
      return
    }

    if (response?.redirect) {
      if (isPaid) {
        trackEvent('begin_checkout', {
          form_name: 'booking',
          event_type: event.title,
          value: event.price ?? 0,
          currency: 'EGP',
          payment_type: paymentMethod,
        })
      } else {
        trackEvent('generate_lead', {
          form_name: 'booking',
          event_type: event.title,
          event_slug: event.slug,
        })
      }

      window.location.href = response.redirect
      return
    }

    trackEvent('generate_lead', {
      form_name: 'booking',
      event_type: event.title,
      event_slug: event.slug,
    })
    setStep('success')
  }

  if (step === 'success') {
    return (
      <div className={s.pageWrap}>
        <div className={s.bookingCard} style={{ justifyContent: 'center' }}>
          <div className={s.successWrap}>
            <div className={s.successIcon}>✓</div>
            <div className={s.successTitle}>تم تأكيد الحجز</div>
            <p className={s.successSub}>
              أرسلنا لك رسالة على البريد بكل تفاصيل الموعد ورابط الجلسة.
            </p>
            <div className={s.successActions}>
              <Link href="/book" className={s.addGuestsBtn}>
                حجز جلسة أخرى
              </Link>
              <Link href="/" className={s.addGuestsBtn}>
                الرجوع للرئيسية
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={s.pageWrap}>
      <div className={s.bookingCard}>
        <aside className={s.sidebar}>
          {step === 'details' ? (
            <button type="button" className={s.backBtn} onClick={() => setStep('calendar')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          ) : null}

          <Image src={userProfile.avatar_url} alt={userProfile.name} width={72} height={72} className={s.sidebarPhoto} />
          <div className={s.sidebarName}>{userProfile.name}</div>
          <div className={s.sidebarTitle}>{event.title}</div>

          <div className={s.sidebarMeta}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {event.duration_minutes} دقيقة
          </div>

          {isPaid ? (
            <div className={s.sidebarMeta}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1v22M17 5H9a4 4 0 000 8h6a4 4 0 010 8H6" />
              </svg>
              {Number(event.price).toLocaleString('ar-EG')} EGP
            </div>
          ) : null}

          {step === 'details' && selectedDateObj && selectedTime ? (
            <>
              <div className={s.sidebarMeta}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {selectedDateObj.toLocaleDateString('ar-EG', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <div className={s.sidebarMeta}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12A10 10 0 1 1 12 2" />
                  <path d="M12 6v6l4 2" />
                </svg>
                {formatTime(selectedTime, userProfile.time_format)} -{' '}
                {formatTime(addMinutes(selectedTime, event.duration_minutes), userProfile.time_format)}
              </div>
              <div className={s.sidebarMeta}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                {timezone}
              </div>
            </>
          ) : null}

          {event.description ? <div className={s.sidebarDesc}>{event.description}</div> : null}
        </aside>

        <section className={s.mainContent}>
          {notice ? <div className={s.noticeBox}>{notice}</div> : null}

          <div className={s.stepTabs}>
            <span className={`${s.stepTab} ${step === 'calendar' ? s.stepTabActive : ''}`}>
              1. اختيار الموعد
            </span>
            <span className={`${s.stepTab} ${step === 'details' ? s.stepTabActive : ''}`}>
              2. بيانات الحجز
            </span>
          </div>

          {step === 'calendar' ? (
            <>
              <div className={s.stepHeading}>اختاري اليوم والوقت المناسب</div>
              <div className={s.calendarWrap}>
                <div className={s.calendarGrid}>
                  <div className={s.monthNav}>
                    <button type="button" className={s.monthNavBtn} onClick={prevMonth}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <div className={s.monthLabel}>
                      {MONTHS_AR[month]} {year}
                    </div>
                    <button type="button" className={s.monthNavBtn} onClick={nextMonth}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>

                  <div className={s.dayHeaders}>
                    {DAYS_AR.map((day) => (
                      <div key={day}>{day.slice(0, 2)}</div>
                    ))}
                  </div>

                  <div className={s.daysGrid}>
                    {calendarDays.map((day, index) => {
                      if (day.day === 0) {
                        return <div key={`empty-${index}`} className={s.dayEmpty} />
                      }

                      const dateValue = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.day
                        .toString()
                        .padStart(2, '0')}`
                      const isSelected = dateValue === selectedDate

                      const className = isSelected
                        ? s.daySelected
                        : day.available
                          ? s.dayAvailable
                          : s.dayUnavailable

                      return (
                        <button
                          key={dateValue}
                          type="button"
                          className={className}
                          onClick={() => (day.available ? selectDate(day.day) : null)}
                          disabled={!day.available}
                        >
                          {day.day}
                        </button>
                      )
                    })}
                  </div>

                  <div className={s.timezoneBar}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    المنطقة الزمنية: {timezone}
                  </div>
                </div>

                {selectedDate ? (
                  <div className={s.timeSlotsPanel}>
                    <div className={s.timeSlotsDate}>
                      {selectedDateObj?.toLocaleDateString('ar-EG', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </div>
                    {slotsLoading ? (
                      <p className={s.profileBio}>جاري تحميل الأوقات...</p>
                    ) : slots.length > 0 ? (
                      slots.map((time) =>
                        selectedTime === time ? (
                          <div key={time} className={s.timeSlotSelected}>
                            <div className={s.timeSlotSelectedTime}>
                              {formatTime(time, userProfile.time_format)}
                            </div>
                            <button
                              type="button"
                              className={s.timeSlotNextBtn}
                              onClick={() => setStep('details')}
                            >
                              متابعة
                            </button>
                          </div>
                        ) : (
                          <button
                            key={time}
                            type="button"
                            className={s.timeSlot}
                            onClick={() => setSelectedTime(time)}
                          >
                            {formatTime(time, userProfile.time_format)}
                          </button>
                        )
                      )
                    ) : (
                      <p className={s.errorText}>لا توجد مواعيد متاحة في هذا اليوم</p>
                    )}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className={s.formSection}>
              <div className={s.stepHeading}>أدخلي بيانات الحجز</div>

              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>الاسم الأول *</label>
                  <input name="first_name" required className={s.formInput} />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>اسم العائلة *</label>
                  <input name="last_name" required className={s.formInput} />
                </div>
              </div>

              <div className={s.formGroup}>
                <label className={s.formLabel}>البريد الإلكتروني *</label>
                <input type="email" name="email" required className={s.formInput} dir="ltr" />
              </div>

              <div className={s.formGroup}>
                <label className={s.formLabel}>رقم الهاتف {isPaid ? '*' : '(اختياري)'}</label>
                <input
                  type="tel"
                  name="phone"
                  required={isPaid}
                  className={s.formInput}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                />
              </div>

              {event.allow_guests ? (
                <>
                  <button
                    type="button"
                    className={s.addGuestsBtn}
                    onClick={() => setShowGuests((current) => !current)}
                  >
                    {showGuests ? 'إخفاء الضيوف' : '+ إضافة ضيوف'}
                  </button>
                  {showGuests ? (
                    <div className={s.formGroup}>
                      <label className={s.formLabel}>إيميلات الضيوف (مفصولة بفاصلة)</label>
                      <input
                        name="guests"
                        className={s.formInput}
                        placeholder="guest1@email.com, guest2@email.com"
                        dir="ltr"
                      />
                    </div>
                  ) : null}
                </>
              ) : null}

              {event.communication_methods && event.communication_methods.length > 0 ? (
                <div className={s.commMethodGroup}>
                  <div className={s.commMethodLabel}>طريقة التواصل *</div>
                  {event.communication_methods.map((method) => (
                    <label key={method} className={s.commOption}>
                      <input
                        type="radio"
                        name="communication_method"
                        value={method}
                        defaultChecked={method === event.communication_methods[0]}
                      />
                      {method === 'google_meet' && 'Google Meet'}
                      {method === 'phone' && 'مكالمة هاتفية'}
                      {method === 'in_person' && 'حضوري'}
                    </label>
                  ))}
                </div>
              ) : null}

              {isPaid ? (
                <div className={s.formGroup}>
                  <label className={s.formLabel}>طريقة الدفع</label>
                  <div className={s.paymentMethods}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`${s.paymentOption} ${paymentMethod === 'card' ? s.paymentOptionActive : ''}`}
                    >
                      بطاقة بنكية
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wallet')}
                      className={`${s.paymentOption} ${paymentMethod === 'wallet' ? s.paymentOptionActive : ''}`}
                    >
                      محفظة إلكترونية
                    </button>
                  </div>
                  <p className={s.termsText}>سيتم تحويلك إلى بوابة الدفع لإتمام الحجز.</p>
                </div>
              ) : null}

              <input type="hidden" name="payment_method" value={paymentMethod} />

              {activeQuestions.map((question, index) => (
                <div key={`${question.text}-${index}`} className={s.formGroup}>
                  <label className={s.formLabel}>
                    {question.text} {question.required ? '*' : ''}
                  </label>
                  <input
                    name={`question_${index}`}
                    required={question.required}
                    className={s.formInput}
                  />
                </div>
              ))}

              <div className={s.formGroup}>
                <label className={s.formLabel}>ملاحظات إضافية</label>
                <textarea
                  name="notes"
                  className={s.formTextarea}
                  placeholder="اكتبي أي تفاصيل مهمة نراجعها قبل الجلسة..."
                />
              </div>

              <p className={s.termsText}>
                بإكمال الحجز أنتِ موافقة على سياسة الاستخدام والخصوصية.
              </p>

              {error ? <p className={s.errorText}>{error}</p> : null}

              <button type="submit" disabled={submitting} className={s.scheduleBtn}>
                {submitting
                  ? 'جاري المتابعة...'
                  : isPaid
                    ? `ادفعي ${Number(event.price).toLocaleString('ar-EG')} ج واحجزي`
                    : 'تأكيد الحجز'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
