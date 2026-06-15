import { motion as Motion } from 'framer-motion'
import {
  ArrowLeft,
  CalendarDays,
  LoaderCircle,
  Megaphone,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useAnnouncement } from '../hooks/useAnnouncements'

function AnnouncementDetails() {
  const { id } = useParams()
  const { announcement, isLoading } = useAnnouncement(id)

  if (isLoading && !announcement) {
    return (
      <>
        <Navbar />
        <main className="grid min-h-[70vh] place-items-center bg-slate-50 pt-[84px]">
          <LoaderCircle
            size={32}
            className="animate-spin text-brand-600"
            aria-label="Loading announcement"
          />
        </main>
        <Footer />
      </>
    )
  }

  if (!announcement) {
    return (
      <>
        <Navbar />
        <main className="grid min-h-[70vh] place-items-center bg-slate-50 px-4 pb-20 pt-36">
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_26px_70px_-42px_rgba(15,23,42,0.45)] sm:p-12"
          >
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Megaphone size={28} aria-hidden="true" />
            </span>
            <h1 className="mt-6 text-3xl font-black tracking-tight text-navy-900">
              Announcement not found
            </h1>
            <p className="mt-3 text-slate-600">
              The announcement may have been moved or is no longer available.
            </p>
            <Link
              to="/announcements"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-brand-700"
            >
              <ArrowLeft size={17} aria-hidden="true" />
              Back to Announcements
            </Link>
          </Motion.div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="bg-slate-50 pb-24 pt-[120px] sm:pb-28 sm:pt-[136px]">
        <div className="section-shell">
          <Motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-4xl"
          >
            <Link
              to="/announcements"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-brand-600 transition hover:text-brand-700"
            >
              <ArrowLeft size={17} aria-hidden="true" />
              Back to Announcements
            </Link>

            <article className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_-48px_rgba(15,23,42,0.5)]">
              <div className="relative isolate overflow-hidden border-b border-blue-100 bg-gradient-to-br from-brand-50 via-white to-blue-100/60 px-6 py-12 sm:px-10 lg:px-14">
                <div className="subtle-grid absolute inset-0 -z-10 opacity-60" />
                <span className="grid size-16 place-items-center rounded-2xl bg-white text-brand-600 shadow-lg shadow-blue-600/10 ring-1 ring-blue-100">
                  <Megaphone size={29} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <div className="mt-7 flex flex-wrap items-center gap-3 text-xs font-bold">
                  <span className="rounded-full bg-brand-600 px-3 py-1.5 text-white">
                    {announcement.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <CalendarDays size={15} aria-hidden="true" />
                    Date posted: {announcement.date}
                  </span>
                </div>
                <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] text-navy-900 sm:text-5xl">
                  {announcement.title}
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                  {announcement.summary}
                </p>
              </div>

              <div className="px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
                <div className="space-y-6 text-base leading-8 text-slate-700">
                  {announcement.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                <div className="mt-10 border-t border-slate-100 pt-8">
                  <Link
                    to="/announcements"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-brand-700"
                  >
                    <ArrowLeft size={17} aria-hidden="true" />
                    Back to Announcements
                  </Link>
                </div>
              </div>
            </article>
          </Motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default AnnouncementDetails
