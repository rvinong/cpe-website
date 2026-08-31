import { motion as Motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircuitBoard,
  Megaphone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useOrganization from '../context/useOrganization'
import { useAnnouncements } from '../hooks/useAnnouncements'
import { useMotionPreferences } from '../hooks/useMotionPreferences'
import { motionEase, springTransition } from '../lib/motion'
import { getPublicMemberPreview } from '../lib/profiles'
import ProfileAvatar from './ProfileAvatar'

function getAnnouncementTime(announcement) {
  const value =
    announcement?.published_at || announcement?.created_at || announcement?.date
  const timestamp = value ? new Date(value).getTime() : 0

  return Number.isNaN(timestamp) ? 0 : timestamp
}

function shuffleMembers(members) {
  const shuffled = [...members]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const currentMember = shuffled[index]

    shuffled[index] = shuffled[randomIndex]
    shuffled[randomIndex] = currentMember
  }

  return shuffled
}

function getRandomizedMemberPreview(members, limit = 3) {
  const validMembers = (Array.isArray(members) ? members : []).filter(
    (member) => member?.profileId || member?.fullName,
  )
  const membersWithPhotos = validMembers.filter((member) => member.avatarPath)
  const membersWithInitials = validMembers.filter((member) => !member.avatarPath)

  return [
    ...shuffleMembers(membersWithPhotos),
    ...shuffleMembers(membersWithInitials),
  ].slice(0, limit)
}

function getMemberRoleLabel(role) {
  return (
    {
      admin: 'Administrator',
      editor: 'Editor',
      faculty: 'Faculty',
      student: 'Student',
    }[role] || 'Member'
  )
}

const fallbackMemberPreview = [
  {
    profileId: 'fallback-community-member',
    fullName: 'Community Member',
    avatarPath: '',
  },
  {
    profileId: 'fallback-student-innovator',
    fullName: 'Student Innovator',
    avatarPath: '',
  },
  {
    profileId: 'fallback-organization-ally',
    fullName: 'Organization Ally',
    avatarPath: '',
  },
]

function Hero() {
  const { profile } = useOrganization()
  const { announcements } = useAnnouncements()
  const { isCompactMotion, shouldReduceMotion } = useMotionPreferences()
  const [memberPreview, setMemberPreview] = useState([])
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
  useEffect(() => {
    let isMounted = true

    getPublicMemberPreview().then((result) => {
      if (!isMounted) return

      setMemberPreview(getRandomizedMemberPreview(result.data))
    })

    return () => {
      isMounted = false
    }
  }, [])

  const displayedMemberPreview = memberPreview.length
    ? memberPreview
    : fallbackMemberPreview
  const trustSignals = [
    [ShieldCheck, 'Official portal', 'Managed for CpE students'],
    [CheckCircle2, 'Verified updates', 'Approved notices and records'],
  ]

  return (
    <section
      id="home"
      className="home-hero relative isolate overflow-hidden pt-[84px]"
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
      <div className="home-hero-photo-tint absolute inset-x-0 bottom-0 top-[84px] -z-20" />
      <div className="home-hero-radial absolute inset-x-0 bottom-0 top-[84px] -z-10" />
      <div className="home-hero-fade absolute inset-x-0 bottom-0 top-[84px] -z-10" />
      <div className="subtle-grid absolute inset-x-0 bottom-0 top-[84px] -z-10 opacity-25" />

      <div className="section-shell flex min-h-[720px] items-center justify-center pt-8 pb-16 sm:min-h-[760px] sm:pt-10 lg:pb-20">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <Motion.div
            initial={{ opacity: shouldReduceMotion ? 1 : 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: introDuration, ease: motionEase }}
            className="home-hero-badge mb-6 inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-[10px] font-extrabold tracking-[0.16em] uppercase sm:text-[11px] sm:tracking-[0.2em]"
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
            className="home-hero-title max-w-5xl text-[clamp(3.35rem,8vw,7rem)] font-black leading-[0.88] tracking-[-0.075em]"
          >
            Welcome to{' '}
            <span className="home-hero-title-accent">ICpEP Connect</span>
            <span className="home-hero-title-dot">.</span>
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
            className="home-hero-copy mt-7 max-w-3xl text-base leading-8 sm:text-lg"
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
            className="home-hero-member-line mt-7 flex flex-col items-center gap-3 text-sm sm:flex-row"
          >
            <span
              className="flex -space-x-2"
              role="list"
              aria-label="Featured community members"
            >
              {displayedMemberPreview.map((member) => (
                <span
                  key={member.profileId || member.fullName}
                  role="listitem"
                  title={`${member.fullName} - ${getMemberRoleLabel(member.role)}`}
                >
                  <ProfileAvatar
                    path={member.avatarPath}
                    name={member.fullName}
                    className="size-9 rounded-full border-2 border-white"
                    textClassName="text-[9px]"
                  />
                </span>
              ))}
            </span>
            <span>
              <strong className="home-hero-member-count font-extrabold">
                200
              </strong>{' '}
              members connected through {profile.name}
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
            className="mt-7 grid w-full max-w-2xl gap-3 sm:grid-cols-2"
          >
            {trustSignals.map(([Icon, title, detail]) => (
              <Motion.div
                key={title}
                whileHover={{ y: -4, scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                transition={springTransition}
                className="home-hero-trust-card group rounded-2xl p-4 transition"
              >
                <span className="home-hero-trust-icon mx-auto grid size-10 place-items-center rounded-xl transition group-hover:-translate-y-0.5">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <p className="home-hero-trust-title mt-3 text-xs font-extrabold">
                  {title}
                </p>
                <p className="home-hero-trust-copy mt-1 text-[11px] leading-5">
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
            className="home-hero-announcement mt-7 w-full max-w-2xl rounded-[1.75rem] p-4 text-left"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="home-hero-announcement-icon grid size-12 shrink-0 place-items-center rounded-2xl">
                <Sparkles size={21} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="home-hero-announcement-label text-[10px] font-extrabold tracking-[0.2em] uppercase">
                  Latest announcement
                </p>
                <h2 className="home-hero-announcement-title mt-1 line-clamp-2 text-lg font-black leading-tight">
                  {latestAnnouncement?.title || 'Announcements will appear here.'}
                </h2>
                <div className="home-hero-announcement-meta mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                  {latestAnnouncement?.category && (
                    <span className="home-hero-announcement-chip home-hero-announcement-chip-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1">
                      <Megaphone size={13} aria-hidden="true" />
                      {latestAnnouncement.category}
                    </span>
                  )}
                  {latestAnnouncement?.date && (
                    <span className="home-hero-announcement-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-1">
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
