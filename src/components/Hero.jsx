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
  const enterX = shouldReduceMotion ? 0 : isCompactMotion ? -16 : -28
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
      <div className="absolute inset-x-0 bottom-0 top-[84px] -z-20 bg-white/30 lg:bg-transparent" />
      <div className="absolute inset-x-0 bottom-0 top-[84px] -z-10 bg-gradient-to-r from-white via-white/90 to-white/15 lg:from-white lg:via-white/75 lg:to-transparent" />
      <div className="absolute inset-x-0 bottom-0 top-[84px] -z-10 bg-gradient-to-t from-white/75 via-transparent to-white/15" />
      <div className="subtle-grid absolute inset-x-0 bottom-0 top-[84px] -z-10 opacity-35" />

      <div className="section-shell grid min-h-[720px] items-start gap-12 pt-4 pb-14 sm:min-h-[760px] sm:pt-5 lg:grid-cols-[1fr_20rem] lg:pt-5 lg:pb-18">
        <div className="max-w-3xl">
          <Motion.div
            initial={{ opacity: shouldReduceMotion ? 1 : 0, x: enterX }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: introDuration, ease: motionEase }}
            className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-2 text-[10px] font-extrabold tracking-[0.16em] text-brand-600 uppercase shadow-sm backdrop-blur sm:text-[11px] sm:tracking-[0.2em]"
          >
            <CircuitBoard size={15} aria-hidden="true" />
            {profile.name}
          </Motion.div>

          <Motion.h1
            initial={{
              opacity: shouldReduceMotion ? 1 : 0,
              x: shouldReduceMotion ? 0 : isCompactMotion ? -18 : -35,
            }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0.01 : isCompactMotion ? 0.52 : 0.75,
              delay: shouldReduceMotion ? 0 : isCompactMotion ? 0.04 : 0.08,
              ease: motionEase,
            }}
            className="text-[clamp(3.4rem,7.4vw,6.6rem)] font-black leading-[0.86] tracking-[-0.072em] text-navy-900"
          >
            <span className="block">Innovation.</span>
            <span className="block">Knowledge.</span>
            <span className="block">
              <span className="text-brand-600">Excellence</span>
              <span className="text-orange-500">.</span>
            </span>
          </Motion.h1>

          <Motion.p
            initial={{
              opacity: shouldReduceMotion ? 1 : 0,
              x: shouldReduceMotion ? 0 : isCompactMotion ? -12 : -25,
            }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: introDuration,
              delay: shouldReduceMotion ? 0 : isCompactMotion ? 0.1 : 0.2,
              ease: motionEase,
            }}
            className="mt-7 max-w-xl text-base leading-8 text-slate-700 sm:text-lg"
          >
            Empowering students through innovation, leadership,
            collaboration, and academic excellence.
          </Motion.p>

          <Motion.div
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: enterY }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0.01 : isCompactMotion ? 0.44 : 0.6,
              delay: shouldReduceMotion ? 0 : isCompactMotion ? 0.16 : 0.34,
              ease: motionEase,
            }}
            className="mt-7 flex flex-col gap-3 sm:flex-row"
          >
            <Motion.a
              href="/about"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="primary-button motion-button px-6 py-4"
            >
              Explore Our Organization
              <ArrowRight size={18} aria-hidden="true" />
            </Motion.a>
            <Motion.a
              href="/account?mode=signup"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="secondary-button motion-button px-6 py-4 backdrop-blur"
            >
              <UsersRound size={18} aria-hidden="true" />
              Join Now
            </Motion.a>
          </Motion.div>

          <Motion.div
            initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: shouldReduceMotion ? 0 : isCompactMotion ? 0.24 : 0.65,
              duration: shouldReduceMotion ? 0.01 : isCompactMotion ? 0.4 : 0.7,
            }}
            className="mt-7 flex items-center gap-4 text-sm text-slate-600"
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
              <strong className="font-extrabold text-navy-900">
                {stats.members.value}
                {stats.members.suffix}
              </strong>{' '}
              student innovators
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
            className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3"
          >
            {trustSignals.map(([Icon, title, detail]) => (
              <Motion.div
                key={title}
                whileHover={{ y: -4, scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                transition={springTransition}
                className="group rounded-2xl border border-white/70 bg-white/75 p-3 shadow-sm backdrop-blur transition hover:border-brand-200 hover:bg-white/90 hover:shadow-[0_18px_45px_-32px_rgba(21,94,239,0.45)]"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:-translate-y-0.5 group-hover:bg-brand-600 group-hover:text-white">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <p className="mt-3 text-xs font-extrabold text-navy-900">
                  {title}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  {detail}
                </p>
              </Motion.div>
            ))}
          </Motion.div>
        </div>

        <Motion.aside
          initial={
            shouldReduceMotion
              ? { opacity: 1, x: 0, y: 0 }
              : isCompactMotion
                ? { opacity: 0, x: 0, y: 16 }
                : { opacity: 0, x: 28, y: 0 }
          }
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0.01 : isCompactMotion ? 0.48 : 0.7,
            delay: shouldReduceMotion ? 0 : isCompactMotion ? 0.18 : 0.28,
            ease: motionEase,
          }}
          className="surface-card w-full max-w-sm justify-self-center overflow-hidden p-5 sm:max-w-md lg:max-w-none lg:justify-self-auto"
        >
          <div className="rounded-2xl bg-navy-950 p-5 text-white">
            <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-orange-400">
              <Sparkles size={21} aria-hidden="true" />
            </span>
            <p className="mt-5 text-[10px] font-extrabold tracking-[0.2em] text-blue-300 uppercase">
              Latest announcement
            </p>
            <h2 className="mt-2 line-clamp-3 text-xl font-black leading-tight">
              {latestAnnouncement?.title || 'Announcements will appear here.'}
            </h2>
            {latestAnnouncement && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-bold text-blue-100">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
                  <Megaphone size={13} aria-hidden="true" />
                  {latestAnnouncement.category}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
                  <CalendarDays size={13} aria-hidden="true" />
                  {latestAnnouncement.date}
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 rounded-xl border border-slate-200 bg-white/75 p-4">
            <p className="line-clamp-4 text-sm leading-6 text-slate-600">
              {latestAnnouncement?.summary ||
                'Published organization updates will be highlighted here for quick access.'}
            </p>
            <Link
              to={latestAnnouncementPath}
              className="primary-button motion-button mt-4 w-full px-4 py-3 text-xs"
            >
              {latestAnnouncement ? 'Read announcement' : 'View announcements'}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </Motion.aside>
      </div>
    </section>
  )
}

export default Hero
