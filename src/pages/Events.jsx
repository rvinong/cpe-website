import { motion as Motion } from 'framer-motion'
import {
  Archive,
  Bell,
  CalendarDays,
  CalendarOff,
  Clock3,
  LoaderCircle,
  MapPin,
  Sun,
} from 'lucide-react'
import EventCard from '../components/EventCard'
import PageHero from '../components/PageHero'
import { useEvents } from '../hooks/useEvents'

const eventInfo = [
  {
    icon: CalendarDays,
    title: 'Upcoming activities',
    description:
      'Confirmed workshops, meetings, and programs will appear here.',
  },
  {
    icon: Bell,
    title: 'Schedule updates',
    description:
      'Official event notices will also be shared through announcements.',
  },
  {
    icon: Archive,
    title: 'Event archive',
    description:
      'Completed activities remain available as an organization record.',
  },
]

function Events() {
  const { upcoming, completed, cancelled, isLoading } = useEvents()

  return (
    <>
      <main className="pt-[84px]">
        <PageHero
          eyebrow="Connect and participate"
          title="Events & Activities"
          description="Find organization workshops, meetings, outreach programs, and other student activities in one place."
          icon={CalendarDays}
          accentIcon={Sun}
        />

        {!isLoading && upcoming.length === 0 && (
          <section className="bg-white py-16 sm:py-20">
            <div className="section-shell">
              <Motion.div
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55 }}
                className="relative isolate overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-brand-50/45 to-amber-50/70 px-6 py-12 shadow-[0_26px_75px_-46px_rgba(15,23,42,0.45)] sm:px-10 sm:py-14 lg:px-14"
              >
                <div className="subtle-grid absolute inset-0 -z-20 opacity-35" />
                <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr]">
                  <span className="grid size-20 place-items-center rounded-3xl bg-white text-brand-600 shadow-lg shadow-blue-600/10 ring-1 ring-blue-100">
                    <CalendarOff
                      size={35}
                      strokeWidth={1.6}
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-3 py-1.5 text-xs font-extrabold text-amber-800">
                      <Sun size={14} aria-hidden="true" />
                      Summer schedule
                    </div>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                      No upcoming events this summer
                    </h2>
                    <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                      There are currently no confirmed Computer Engineering
                      Organization events. The calendar will update
                      automatically when a new activity is published.
                    </p>
                  </div>
                </div>
              </Motion.div>
            </div>
          </section>
        )}

        <section className="bg-slate-50/70 py-20 sm:py-24">
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-2xl text-center"
            >
              <p className="text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
                Event calendar
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                Upcoming Events
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Confirmed events are listed with their dates, times, venues,
                and complete details.
              </p>
            </Motion.div>

            {isLoading ? (
              <div className="grid min-h-48 place-items-center">
                <LoaderCircle
                  size={30}
                  className="animate-spin text-brand-600"
                  aria-label="Loading events"
                />
              </div>
            ) : upcoming.length > 0 ? (
              <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {upcoming.map((event, index) => (
                  <Motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: index * 0.06 }}
                  >
                    <EventCard event={event} />
                  </Motion.div>
                ))}
              </div>
            ) : (
              <Motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="mx-auto mt-10 max-w-3xl rounded-2xl border border-dashed border-blue-200 bg-white px-6 py-12 text-center sm:px-10"
              >
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <Clock3 size={25} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-xl font-extrabold text-navy-900">
                  The calendar is currently clear
                </h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
                  Enjoy the summer break. Check back when organization
                  activities resume.
                </p>
              </Motion.div>
            )}

            {cancelled.length > 0 && (
              <div className="mt-16">
                <div className="mb-6">
                  <p className="text-xs font-extrabold tracking-[0.18em] text-red-600 uppercase">
                    Schedule changes
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-navy-900">
                    Cancelled Events
                  </h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {cancelled.map((event) => (
                    <EventCard key={event.id} event={event} compact />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {eventInfo.map(({ icon: Icon, title, description }, index) => (
                <Motion.article
                  key={title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.5, delay: index * 0.07 }}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.32)]"
                >
                  <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-extrabold text-navy-900">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                </Motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5 }}
              className="mb-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
            >
              <div>
                <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
                  Organization record
                </p>
                <h2 className="mt-2 text-3xl font-black text-navy-900">
                  Past Event Archive
                </h2>
              </div>
              <p className="text-sm font-bold text-slate-500">
                {completed.length} completed{' '}
                {completed.length === 1 ? 'event' : 'events'}
              </p>
            </Motion.div>

            {completed.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {completed.map((event) => (
                  <EventCard key={event.id} event={event} compact />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-navy-950 px-6 py-12 text-center text-white shadow-[0_30px_80px_-44px_rgba(7,21,47,0.8)] sm:px-10">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/10 text-blue-200">
                  <MapPin size={25} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-2xl font-black">
                  No completed event records yet
                </h3>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  Published events move here automatically after their
                  scheduled end time.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}

export default Events
