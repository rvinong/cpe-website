import { motion as Motion } from 'framer-motion'
import { Bell, Inbox, Megaphone, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import AnnouncementCard from '../components/AnnouncementCard'
import ContentSkeleton from '../components/ContentSkeleton'
import EmptyState from '../components/EmptyState'
import PageHero from '../components/PageHero'
import { announcementCategories } from '../data/announcements'
import { useAnnouncements } from '../hooks/useAnnouncements'

function Announcements() {
  const { announcements, isLoading } = useAnnouncements()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const categories = useMemo(() => announcementCategories, [])

  const filteredAnnouncements = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return announcements.filter((announcement) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        announcement.category === selectedCategory
      const matchesSearch =
        !normalizedSearch ||
        [announcement.title, announcement.summary, announcement.category]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [announcements, searchTerm, selectedCategory])

  const featuredAnnouncement = filteredAnnouncements.find(
    (announcement) => announcement.isFeatured,
  )
  const remainingAnnouncements = featuredAnnouncement
    ? filteredAnnouncements.filter(
        (announcement) => announcement.id !== featuredAnnouncement.id,
      )
    : filteredAnnouncements

  return (
    <>
      <main className="pt-[84px]">
        <PageHero
          eyebrow="Stay informed"
          title="Announcements"
          description="Stay updated with the latest news, events, opportunities, and important notices from the organization."
          icon={Megaphone}
          accentIcon={Bell}
          robotVariant="chat"
        />

        <section className="bg-white py-14 sm:py-16">
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55 }}
              className="filter-panel"
            >
              <label className="relative block" htmlFor="announcement-search">
                <span className="sr-only">Search announcements</span>
                <Search
                  size={20}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="announcement-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search announcements..."
                  className="field-control pl-12 pr-4 placeholder:text-slate-400"
                />
              </label>

              <div
                className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start"
                aria-label="Filter announcements by category"
              >
                {categories.map((category) => {
                  const isActive = selectedCategory === category

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      aria-pressed={isActive}
                      className={`filter-chip ${
                        isActive ? 'filter-chip-active' : ''
                      }`}
                    >
                      {category}
                    </button>
                  )
                })}
              </div>
            </Motion.div>
          </div>
        </section>

        <section className="bg-slate-50/70 pb-24 pt-8 sm:pb-28">
          <div className="section-shell">
            {isLoading ? (
              <ContentSkeleton count={3} label="Loading announcements" />
            ) : (
              <>
                {featuredAnnouncement && (
                  <Motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="mb-6 flex items-center gap-3">
                      <span className="h-px w-8 bg-brand-600" />
                      <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
                        Featured announcement
                      </p>
                    </div>
                    <AnnouncementCard
                      announcement={featuredAnnouncement}
                      featured
                    />
                  </Motion.div>
                )}

                {remainingAnnouncements.length > 0 ? (
                  <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {remainingAnnouncements.map((announcement, index) => (
                      <Motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.5, delay: index * 0.06 }}
                      >
                        <AnnouncementCard announcement={announcement} />
                      </Motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Inbox}
                    compact
                    className={featuredAnnouncement ? 'mt-10' : ''}
                    title={
                      featuredAnnouncement
                        ? 'No other announcements yet'
                        : 'No announcements found'
                    }
                    description={
                      featuredAnnouncement
                        ? 'More updates will be posted here soon.'
                        : 'Try another search term or choose a different category.'
                    }
                  />
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </>
  )
}

export default Announcements
