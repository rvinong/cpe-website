import { motion as Motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircuitBoard,
  Megaphone,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import useOrganization from '../context/useOrganization'
import { useAnnouncements } from '../hooks/useAnnouncements'
import { useMotionPreferences } from '../hooks/useMotionPreferences'
import { motionEase, springTransition } from '../lib/motion'

function getAnnouncementTime(announcement) {
  const value =
    announcement?.published_at || announcement?.created_at || announcement?.date
  const timestamp = value ? new Date(value).getTime() : 0

  return Number.isNaN(timestamp) ? 0 : timestamp
}

function Hero() {
  const { profile, stats } = useOrganization()
  const { announcements } = useAnnouncements()
  const { isCompactMotion, shouldReduceMotion } = useMotionPreferences()
  const enterY = shouldReduceMotion ? 0 : isCompactMotion ? 12 : 22
  const introDuration = shouldReduceMotion
    ? 0.01
    : isCompactMotion
      ? 0.46
      : 0.65
  const latestAnnouncement = useMemo(
    () =>
      [...announcements].sort(
        (first, second) =>
          getAnnouncementTime(second) - getAnnouncementTime(first),
      )[0] ?? null,
    [announcements],
  )
  const latestAnnouncementPath = latestAnnouncement
    ? `/announcements/${latestAnnouncement.id}`
    : '/announcements'
  const trustSignals = [
    [ShieldCheck, 'Official portal', 'Managed for CpE students'],
    [CheckCircle2, 'Verified updates', 'Approved notices and records'],
    [
      UsersRound,
      'Student-led',
      `${stats.members.value}${stats.members.suffix} student innovators`,
    ],
  ]

  return (
    <section
      id="home"
      className="relative isolate overflow-hidden bg-slate-100 pt-[84px]"
    >
      <div className="absolute inset-x-0 bottom-0 top-[84px] -z-30 overflow-hidden">
        <Motion.img
          src="/images/nwssu-cpe-hero.jpg"
          alt={`${profile.name} students gathered at a chapter event`}
          width="1920"
          height="1080"
          fetchPriority="high"
          className="h-full w-full scale-[1.02] object-cover object-[62%_center] sm:object-center"
          initial={
            shouldReduceMotion
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: isCompactMotion ? 1.018 : 1.035 }
          }
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: shouldReduceMotion ? 0.01 : isCompactMotion ? 0.8 : 1.2,
            ease: motionEase,
          }}
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 top-[84px] -z-20 bg-white/55 dark:bg-navy-950/70" />
      <div className="absolute inset-x-0 bottom-0 top-[84px] -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9),rgba(255,255,255,0.72)_46%,rgba(255,255,255,0.24)_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(7,17,31,0.9),rgba(7,17,31,0.74)_48%,rgba(7,17,31,0.44)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 top-[84px] -z-10 bg-gradient-to-b from-white/70 via-transparent to-white/85 dark:from-navy-950/80 dark:via-transparent dark:to-navy-950/90" />
      <div className="subtle-grid absolute inset-x-0 bottom-0 top-[84px] -z-10 opacity-25" />

      <div className="section-shell flex min-h-[720px] items-center justify-center pt-8 pb-16 sm:min-h-[760px] sm:pt-10 lg:pb-20">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <Motion.div
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: introDuration, ease: motionEase }}
            className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-2 text-[10px] font-extrabold tracking-[0.16em] text-brand-600 uppercase shadow-sm backdrop-blur dark:border-blue-300/20 dark:bg-navy-950/75 dark:text-blue-200 sm:text-[11px] sm:tracking-[0.2em]"
          >
            <CircuitBoard size={15} aria-hidden="true" />
            Official Computer Engineering Organization Portal
          </Motion.div>

          <Motion.h1
            initial={{
              opacity: shouldReduceMotion ? 1 : 0,
              y: shouldReduceMotion ? 0 : isCompactMotion ? 12 : 24,
            }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0.01 : isCompactMotion ? 0.52 : 0.75,
              delay: shouldReduceMotion ? 0 : isCompactMotion ? 0.04 : 0.08,
              ease: motionEase,
            }}
            className="max-w-5xl text-[clamp(3.35rem,8vw,7rem)] font-black leading-[0.88] tracking-[-0.075em] text-navy-900 dark:text-white"
          >
            Welcome to{' '}
            <span className="text-brand-600 dark:text-blue-300">ICpEP Connect</span>
            <span className="text-orange-500">.</span>
          </Motion.h1>

          <Motion.p
            initial={{
              opacity: shouldReduceMotion ? 1 : 0,
              y: shouldReduceMotion ? 0 : isCompactMotion ? 10 : 18,
            }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: introDuration,
              delay: shouldReduceMotion ? 0 : isCompactMotion ? 0.1 : 0.2,
              ease: motionEase,
            }}
            className="mt-7 max-w-3xl text-base leading-8 text-slate-700 dark:text-slate-200 sm:text-lg"
          >
            Your central space for announcements, events, academic resources,
            alumni records, and official organization updates.
          </Motion.p>

          <Motion.div
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: enterY }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0.01 : isCompactMotion ? 0.44 : 0.6,
              delay: shouldReduceMotion ? 0 : isCompactMotion ? 0.16 : 0.34,
              ease: motionEase,
            }}
            className="mt-8 flex w-full max-w-md flex-col justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-row"
          >
            <Motion.a
              href="/student-portal"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="primary-button motion-button justify-center px-6 py-4"
            >
              Enter Student Portal
              <ArrowRight size={18} aria-hidden="true" />
            </Motion.a>
            <Motion.a
              href="/announcements"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="secondary-button motion-button justify-center px-6 py-4 backdrop-blur"
            >
              <Megaphone size={18} aria-hidden="true" />
              Explore Updates
            </Motion.a>
          </Motion.div>

          <Motion.div
            initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: shouldReduceMotion ? 0 : isCompactMotion ? 0.24 : 0.65,
              duration: shouldReduceMotion ? 0.01 : isCompactMotion ? 0.4 : 0.7,
            }}
            className="mt-7 flex flex-col items-center gap-3 text-sm text-slate-600 dark:text-slate-300 sm:flex-row"
          >
            <span className="flex -space-x-2" aria-hidden="true">
              {['CP', 'ES', 'AI'].map((initials, index) => (
                <span
                  key={initials}
                  className={`grid size-9 place-items-center rounded-full border-2 border-white text-[9px] font-black text-white ${
                    ['bg-brand-600', 'bg-indigo-500', 'bg-emerald-500'][index]
                  }`}
                >
                  {initials}
                </span>
              ))}
            </span>
            <span>
              <strong className="font-extrabold text-navy-900 dark:text-white">
                {stats.members.value}
                {stats.members.suffix}
              </strong>{' '}
              student innovators connected through {profile.name}
            </span>
          </Motion.div>

          <Motion.div
            initial={{
              opacity: shouldReduceMotion ? 1 : 0,
              y: shouldReduceMotion ? 0 : isCompactMotion ? 10 : 18,
            }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: shouldReduceMotion ? 0 : isCompactMotion ? 0.28 : 0.78,
              duration: shouldReduceMotion ? 0.01 : isCompactMotion ? 0.4 : 0.55,
              ease: motionEase,
            }}
            className="mt-7 grid w-full max-w-3xl gap-3 sm:grid-cols-3"
          >
            {trustSignals.map(([Icon, title, detail]) => (
              <Motion.div
                key={title}
                whileHover={{ y: -4, scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                transition={springTransition}
                className="group rounded-2xl border border-white/80 bg-white/78 p-4 shadow-sm backdrop-blur transition hover:border-brand-200 hover:bg-white/95 hover:shadow-[0_18px_45px_-32px_rgba(21,94,239,0.45)] dark:border-blue-300/15 dark:bg-navy-950/70 dark:hover:border-blue-300/35 dark:hover:bg-navy-900/80"
              >
                <span className="mx-auto grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:-translate-y-0.5 group-hover:bg-brand-600 group-hover:text-white dark:bg-blue-400/10 dark:text-blue-200 dark:group-hover:bg-blue-500/25 dark:group-hover:text-white">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <p className="mt-3 text-xs font-extrabold text-navy-900 dark:text-white">
                  {title}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  {detail}
                </p>
              </Motion.div>
            ))}
          </Motion.div>

          <Motion.div
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: enterY }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0.01 : isCompactMotion ? 0.44 : 0.6,
              delay: shouldReduceMotion ? 0 : isCompactMotion ? 0.34 : 0.88,
              ease: motionEase,
            }}
            className="mt-7 w-full max-w-2xl rounded-[1.75rem] border border-white/80 bg-white/82 p-4 text-left shadow-[0_24px_70px_-48px_rgba(15,23,42,0.58)] backdrop-blur dark:border-blue-300/15 dark:bg-navy-950/75"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-navy-950 text-orange-400 dark:bg-blue-500/15 dark:text-orange-300">
                <Sparkles size={21} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold tracking-[0.2em] text-brand-600 uppercase dark:text-blue-200">
                  Latest announcement
                </p>
                <h2 className="mt-1 line-clamp-2 text-lg font-black leading-tight text-navy-900 dark:text-white">
                  {latestAnnouncement?.title || 'Announcements will appear here.'}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {latestAnnouncement?.category && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-brand-700 dark:bg-blue-400/10 dark:text-blue-200">
                      <Megaphone size={13} aria-hidden="true" />
                      {latestAnnouncement.category}
                    </span>
                  )}
                  {latestAnnouncement?.date && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      <CalendarDays size={13} aria-hidden="true" />
                      {latestAnnouncement.date}
                    </span>
                  )}
                </div>
              </div>
              <Link
                to={latestAnnouncementPath}
                className="primary-button motion-button justify-center px-4 py-3 text-xs sm:shrink-0"
              >
                {latestAnnouncement ? 'Read announcement' : 'View announcements'}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </Motion.div>
        </div>
      </div>
    </section>
  )
}

export default Hero
