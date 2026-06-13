import { motion as Motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarOff,
  LoaderCircle,
  Sun,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEvents } from '../hooks/useEvents'
import EventCard from './EventCard'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

function UpcomingEvents() {
  const { upcoming, isLoading } = useEvents()
  const homepageEvents = upcoming.slice(0, 3)

  return (
    <section id="events" className="bg-slate-50/70 py-24 sm:py-28">
      <div className="section-shell">
        <Reveal>
          <SectionHeader
            eyebrow="Organization calendar"
            title="Upcoming Events"
            description="Check the latest organization activities, workshops, meetings, and student programs."
            actionLabel="View events page"
            actionHref="/events"
          />
        </Reveal>

        {isLoading ? (
          <div className="grid min-h-52 place-items-center">
            <LoaderCircle
              size={30}
              className="animate-spin text-brand-600"
              aria-label="Loading upcoming events"
            />
          </div>
        ) : homepageEvents.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {homepageEvents.map((event, index) => (
              <Reveal key={event.id} delay={index * 0.08}>
                <EventCard event={event} compact />
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal delay={0.08}>
            <Motion.div
              whileHover={{ y: -3 }}
              className="relative isolate overflow-hidden rounded-3xl border border-blue-100 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-45px_rgba(15,23,42,0.4)] sm:px-10 sm:py-14"
            >
              <div className="subtle-grid absolute inset-0 -z-20 opacity-45" />
              <div className="absolute -right-16 -top-20 -z-10 size-56 rounded-full bg-amber-100/70 blur-3xl" />

              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 shadow-sm ring-1 ring-blue-100">
                <CalendarOff
                  size={29}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
              </span>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-700 ring-1 ring-amber-100">
                <Sun size={14} aria-hidden="true" />
                Summer break
              </div>
              <h3 className="mt-5 text-2xl font-black tracking-tight text-navy-900 sm:text-3xl">
                No upcoming events scheduled
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
                There are no confirmed organization events this summer. New
                activities will appear here as soon as they are published.
              </p>
              <Link
                to="/events"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-brand-700"
              >
                Open Events Page
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </Motion.div>
          </Reveal>
        )}
      </div>
    </section>
  )
}

export default UpcomingEvents
