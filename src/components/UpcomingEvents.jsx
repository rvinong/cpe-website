import { CalendarOff } from 'lucide-react'
import { useEvents } from '../hooks/useEvents'
import ContentSkeleton from './ContentSkeleton'
import EmptyState from './EmptyState'
import EventCard from './EventCard'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

function UpcomingEvents() {
  const { upcoming, isLoading } = useEvents()
  const homepageEvents = upcoming.slice(0, 3)

  return (
    <section id="events" className="bg-slate-50/70 py-24 sm:py-32">
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
          <ContentSkeleton count={3} label="Loading upcoming events" />
        ) : homepageEvents.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {homepageEvents.map((event, index) => (
              <Reveal
                key={event.id}
                delay={index * 0.08}
                direction={index % 2 === 0 ? 'left' : 'right'}
              >
                <EventCard
                  event={event}
                  compact
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarOff}
            title="No upcoming events scheduled"
            description="There are no confirmed organization events this summer. New activities will appear here as soon as they are published."
            actionLabel="Open events page"
            actionHref="/events"
          />
        )}
      </div>
    </section>
  )
}

export default UpcomingEvents
