import { motion as Motion } from 'framer-motion'
import { Bell, Inbox, Megaphone, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import AnnouncementCard from '../components/AnnouncementCard'
import PageHero from '../components/PageHero'
import { announcementCategories } from '../data/announcements'
import { useAnnouncements } from '../hooks/useAnnouncements'

function Announcements() {
  const { announcements } = useAnnouncements()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const categories = useMemo(
    () => [
      ...new Set([
        ...announcementCategories,
        ...announcements.map((announcement) => announcement.category),
      ]),
    ],
    [announcements],
  )

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

  const featuredAnnouncement = filteredAnnouncements[0]
  const remainingAnnouncements = filteredAnnouncements.slice(1)

  return (
    <>
      <main className="pt-[84px]">
        <PageHero
          eyebrow="Stay informed"
          title="Announcements"
          description="Stay updated with the latest news, events, opportunities, and important notices from the organization."
          icon={Megaphone}
          accentIcon={Bell}
        />

        <section className="bg-white py-14 sm:py-16">
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.35)] sm:p-6"
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
                  className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-12 pr-4 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                />
              </label>

              <div
                className="mt-5 flex flex-wrap gap-2"
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
                      className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md shadow-blue-600/20'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-600'
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
              <Motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className={`rounded-2xl border border-blue-100 bg-brand-50/55 px-6 py-12 text-center sm:px-10 ${
                  featuredAnnouncement ? 'mt-10' : ''
                }`}
              >
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-blue-100">
                  <Inbox size={25} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-xl font-extrabold text-navy-900">
                  {featuredAnnouncement
                    ? 'No other announcements yet.'
                    : 'No announcements found.'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {featuredAnnouncement
                    ? 'More updates will be posted here soon.'
                    : 'Try another search term or choose a different category.'}
                </p>
              </Motion.div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}

export default Announcements
