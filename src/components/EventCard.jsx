import {
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
} from 'lucide-react'
import { getSafeHttpUrl } from '../lib/safeUrl'

const timingStyles = {
  upcoming: 'bg-brand-50 text-brand-700 ring-blue-100',
  completed: 'bg-slate-100 text-slate-600 ring-slate-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

function EventCard({ event, compact = false }) {
  const registrationUrl = getSafeHttpUrl(event.registration_url)
  const timingLabel = {
    upcoming: 'Upcoming',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }[event.timing]

  return (
    <div className="h-full">
      <article className="surface-card interactive-card group relative isolate flex h-full flex-col overflow-hidden">
        <span className="brand-corner-orb absolute -right-12 -top-12 -z-10 size-32 rounded-full transition duration-500 group-hover:scale-125" />
      <div
        className={`h-1 ${
          event.timing === 'cancelled'
            ? 'bg-gradient-to-r from-red-500 to-red-400'
            : 'bg-gradient-to-r from-brand-700 to-brand-500'
        }`}
      />
      {(event.cardImage || event.image) && (
        <div className={compact ? 'media-frame h-48' : 'media-frame h-56'}>
          <img
            src={event.cardImage || event.image}
            alt={event.imageAlt || ''}
            loading="lazy"
            decoding="async"
            className="media-image"
          />
        </div>
      )}
        <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold tracking-wide uppercase ring-1 ring-inset ${
              timingStyles[event.timing]
            }`}
          >
            {timingLabel}
          </span>
          <span className="text-xs font-bold text-slate-500">
            {event.category}
          </span>
          {event.isFeatured && (
            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-extrabold tracking-wide text-orange-500 uppercase ring-1 ring-orange-100">
              Featured
            </span>
          )}
        </div>

        <h3 className="mt-4 text-xl font-black tracking-tight text-navy-900 transition-colors duration-200 group-hover:text-brand-600">
          {event.title}
        </h3>
        <p
          className={`mt-3 text-sm leading-6 text-slate-600 ${
            compact ? 'line-clamp-3' : ''
          }`}
        >
          {event.summary}
        </p>

        <div className="mt-5 grid gap-2.5 text-xs font-bold text-slate-500">
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={15} className="text-brand-600" />
            {event.date}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 size={15} className="text-brand-600" />
            {event.time}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin size={15} className="text-brand-600" />
            {event.venue}
          </span>
        </div>

        {!compact && event.description && (
          <p className="mt-5 border-t border-slate-100 pt-5 text-sm leading-7 text-slate-600">
            {event.description}
          </p>
        )}

        {registrationUrl &&
          event.timing === 'upcoming' &&
          event.status !== 'cancelled' && (
            <a
              href={registrationUrl}
              target="_blank"
              rel="noreferrer"
              className="primary-button motion-button mt-6 self-start"
            >
              Registration details
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          )}
        </div>
      </article>
    </div>
  )
}

export default EventCard
