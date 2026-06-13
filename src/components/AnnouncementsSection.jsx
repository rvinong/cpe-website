import { useAnnouncements } from '../hooks/useAnnouncements'
import AnnouncementCard from './AnnouncementCard'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

function AnnouncementsSection() {
  const { announcements } = useAnnouncements(3)

  return (
    <section id="announcements" className="bg-slate-50/70 py-24 sm:py-28">
      <div className="section-shell">
        <Reveal>
          <SectionHeader
            eyebrow="Stay informed"
            title="Latest Announcements"
            description="Important updates, achievements, and opportunities from the organization."
            actionLabel="View all announcements"
            actionHref="/announcements"
          />
        </Reveal>

        {announcements.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {announcements.map((announcement, index) => (
              <Reveal key={announcement.id} delay={index * 0.09}>
                <AnnouncementCard announcement={announcement} />
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal>
            <div className="rounded-2xl border border-blue-100 bg-brand-50/55 px-6 py-10 text-center text-sm font-bold text-slate-600">
              No published announcements yet.
            </div>
          </Reveal>
        )}
      </div>
    </section>
  )
}

export default AnnouncementsSection
