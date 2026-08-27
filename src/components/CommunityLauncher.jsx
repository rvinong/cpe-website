import { motion as Motion } from 'framer-motion'
import { LockKeyhole, MessageCircle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { useMotionPreferences } from '../hooks/useMotionPreferences'

const MotionLink = Motion.create(Link)

function CommunityLauncher() {
  const { pathname } = useLocation()
  const { user, isApprovedMember } = useAuth()
  const { shouldReduceMotion } = useMotionPreferences()

  if (pathname.startsWith('/community')) return null

  const needsApproval = Boolean(user && !isApprovedMember)
  const Icon = needsApproval ? LockKeyhole : MessageCircle
  const destination = user
    ? '/community'
    : '/account?mode=login&redirect=%2Fcommunity'
  const label = needsApproval ? 'Community access' : 'Community Hub'

  return (
    <MotionLink
      to={destination}
      aria-label={
        needsApproval
          ? 'Open the Community Hub to check access'
          : 'Open the Community Hub'
      }
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={shouldReduceMotion ? undefined : { y: -4, scale: 1.015 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
      transition={{ duration: shouldReduceMotion ? 0.01 : 0.38 }}
      className="community-launcher group fixed z-40 inline-flex items-center gap-2 rounded-full px-3 py-2.5 shadow-[0_18px_45px_-22px_rgba(21,94,239,0.5)] backdrop-blur-md transition sm:gap-2.5 sm:px-4 sm:py-3"
      style={{
        right: 'max(1rem, env(safe-area-inset-right))',
        bottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <span className="relative grid size-10 place-items-center rounded-full bg-brand-600 text-white shadow-[0_10px_22px_-12px_rgba(21,94,239,0.9)] transition group-hover:bg-brand-500 sm:size-11">
        <Icon size={19} strokeWidth={2} aria-hidden="true" />
        {!needsApproval && (
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-white bg-orange-500 dark:border-navy-900" />
        )}
      </span>
      <span className="hidden pr-1 text-left sm:block">
        <span className="block text-[10px] font-black tracking-[0.16em] text-brand-600 uppercase dark:text-blue-300">
          Connect
        </span>
        <span className="mt-0.5 block text-xs font-extrabold">{label}</span>
      </span>
    </MotionLink>
  )
}

export default CommunityLauncher
