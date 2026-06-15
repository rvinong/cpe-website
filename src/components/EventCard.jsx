import {
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
} from 'lucide-react'

const timingStyles = {
  upcoming: 'bg-brand-50 text-brand-700 ring-blue-100',
  completed: 'bg-slate-100 text-slate-600 ring-slate-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

function EventCard({ event, compact = false }) {
  return (
    <article className="surface-card group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-brand-500">
      <div className="h-1 bg-gradient-to-r from-brand-600 via-blue-400 to-orange-400" />
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold tracking-wide uppercase ring-1 ring-inset ${
              timingStyles[event.timing]
            }`}
          >
            {event.timing}
          </span>
          <span className="text-xs font-bold text-slate-500">
            {event.category}
          </span>
        </div>

        <h3 className="mt-4 text-xl font-black tracking-tight text-navy-900">
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

        {event.registration_url &&
          event.timing === 'upcoming' &&
          event.status !== 'cancelled' && (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 self-start rounded-xl bg-brand-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-brand-700"
            >
              Registration details
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          )}
      </div>
    </article>
  )
}

export default EventCard
