import { motion as Motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Megaphone } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { springTransition } from '../lib/motion'

function AnnouncementCard({ announcement, featured = false }) {
  const navigate = useNavigate()
  const detailsPath = `/announcements/${announcement.id}`

  const openAnnouncement = (event) => {
    if (event.target.closest('a, button')) return
    navigate(detailsPath)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      navigate(detailsPath)
    }
  }

  return (
    <Motion.article
      tabIndex={0}
      role="link"
      aria-label={`Read full details about ${announcement.title}`}
      onClick={openAnnouncement}
      onKeyDown={handleKeyDown}
      whileHover={{ y: featured ? -5 : -7 }}
      whileTap={{ scale: 0.992 }}
      transition={springTransition}
      className={`surface-card group cursor-pointer outline-none transition-[border-color,box-shadow] duration-300 hover:border-brand-500 focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-100 ${
        featured
          ? 'p-7 hover:shadow-[0_30px_75px_-35px_rgba(21,94,239,0.28)] sm:p-9 lg:p-10'
          : 'flex h-full flex-col p-7 hover:shadow-[0_26px_65px_-30px_rgba(21,94,239,0.22)]'
      }`}
    >
      <div
        className={
          featured
            ? 'grid gap-7 lg:grid-cols-[auto_1fr_auto] lg:items-center'
            : 'flex h-full flex-col'
        }
      >
        <span
          className={`grid shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 ${
            featured ? 'size-16' : 'size-12'
          }`}
        >
          <Megaphone
            size={featured ? 29 : 22}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </span>

        <div className={featured ? '' : 'mt-6 flex flex-1 flex-col'}>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <span className="rounded-full bg-brand-50 px-3 py-1.5 text-brand-600">
              {announcement.category}
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <CalendarDays size={14} aria-hidden="true" />
              {announcement.date}
            </span>
          </div>

          <h3
            className={`font-extrabold tracking-tight text-navy-900 ${
              featured ? 'mt-4 text-2xl sm:text-3xl' : 'mt-4 text-xl'
            }`}
          >
            {announcement.title}
          </h3>
          <p
            className={`text-slate-600 ${
              featured
                ? 'mt-3 max-w-3xl text-base leading-7'
                : 'mt-3 flex-1 text-sm leading-6'
            }`}
          >
            {announcement.summary}
          </p>
        </div>

        <Link
          to={detailsPath}
          className={
            featured
              ? 'primary-button motion-button shrink-0 px-5 py-3.5'
              : 'secondary-button motion-button mt-6 self-start border-blue-200 bg-brand-50 text-brand-700 shadow-sm hover:border-brand-500 hover:bg-brand-600 hover:text-white'
          }
        >
          {featured ? 'Read Full Details' : 'Read more'}
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </Motion.article>
  )
}

export default AnnouncementCard
