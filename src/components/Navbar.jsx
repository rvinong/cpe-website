import {
  AnimatePresence,
  motion as Motion,
} from 'framer-motion'
import { ArrowUpRight, LogIn, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { useMotionPreferences } from '../hooks/useMotionPreferences'
import { motionEase } from '../lib/motion'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

const links = [
  { key: 'home', label: 'Home', sectionId: 'home' },
  {
    key: 'announcements',
    label: 'Announcements',
    sectionId: 'announcements',
  },
  { key: 'portal', label: 'Student Portal', sectionId: 'quick-access' },
  { key: 'about', label: 'About', sectionId: 'about' },
  { key: 'events', label: 'Events', sectionId: 'events' },
  { key: 'alumni', label: 'Alumni', sectionId: 'alumni' },
  { key: 'gallery', label: 'News & Gallery', sectionId: 'news' },
]

const MotionLink = Motion.create(Link)

function Navbar() {
  const { pathname } = useLocation()
  const { user, canAccessAdmin } = useAuth()
  const { isCompactMotion, shouldReduceMotion } = useMotionPreferences()
  const isHomePage = pathname === '/'
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const displayedActiveKey =
    pathname === '/account'
      ? null
      : pathname.startsWith('/announcements')
      ? 'announcements'
      : pathname === '/alumni'
        ? 'alumni'
      : pathname === '/about'
        ? 'about'
      : pathname === '/gallery'
        ? 'gallery'
      : pathname === '/events'
        ? 'events'
      : pathname === '/student-portal'
          ? 'portal'
          : 'home'

  const getLinkHref = (link) => {
    if (link.key === 'announcements') return '/announcements'
    if (link.key === 'about') return '/about'
    if (link.key === 'alumni') return '/alumni'
    if (link.key === 'events') return '/events'
    if (link.key === 'gallery') return '/gallery'
    if (link.key === 'portal') return '/student-portal'
    return isHomePage ? `#${link.sectionId}` : `/#${link.sectionId}`
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : isCompactMotion ? -8 : -12,
      scale: shouldReduceMotion ? 1 : isCompactMotion ? 0.992 : 0.985,
    },
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0.01 : isCompactMotion ? 0.2 : 0.24,
        ease: motionEase,
        staggerChildren: shouldReduceMotion ? 0 : isCompactMotion ? 0.032 : 0.045,
        delayChildren: shouldReduceMotion ? 0 : 0.035,
      },
    },
  }

  const mobileItemVariants = {
    closed: {
      opacity: 0,
      x: shouldReduceMotion ? 0 : isCompactMotion ? 10 : 18,
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : isCompactMotion ? 0.18 : 0.24,
        ease: motionEase,
      },
    },
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-2 pt-2 sm:px-4">
      <div
        className={`section-shell relative flex items-center justify-between gap-3 border px-3 transition-all duration-300 sm:gap-5 sm:px-4 ${
          isScrolled ? 'h-[60px] rounded-xl' : 'h-[68px] rounded-2xl'
        } ${
          isScrolled
            ? 'border-slate-200/90 bg-white/95 shadow-[0_16px_42px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl'
            : 'border-white/70 bg-white/85 shadow-[0_12px_34px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl'
        }`}
      >
        <Logo className="w-full pr-14 sm:pr-28 xl:w-auto xl:flex-none xl:pr-0" />

        <nav aria-label="Primary navigation" className="hidden xl:block">
          <ul className="flex items-stretch overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50/70">
            {links.map((link, index) => {
              const isActive = displayedActiveKey === link.key
              const edgeRadius =
                index === 0
                  ? 'rounded-l-[11px]'
                  : index === links.length - 1
                    ? 'rounded-r-[11px]'
                    : 'rounded-lg'

              return (
              <li key={link.label} className="relative flex">
                <MotionLink
                  to={getLinkHref(link)}
                  onClick={handleLinkClick}
                  aria-current={isActive ? 'location' : undefined}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                  whileHover={
                    shouldReduceMotion ? undefined : { y: -1 }
                  }
                  className={`relative isolate flex items-center px-3.5 py-2.5 text-[12px] font-extrabold transition-colors ${
                    isActive
                      ? 'text-brand-600'
                      : 'text-slate-600 hover:text-brand-600'
                  }`}
                >
                  {isActive && (
                    <Motion.span
                      layoutId="primary-navigation-active"
                      className={`absolute inset-0 -z-10 bg-white shadow-[0_4px_14px_-8px_rgba(15,23,42,0.45)] ${edgeRadius}`}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0.01 }
                          : {
                              type: 'spring',
                              stiffness: 430,
                              damping: 34,
                              mass: 0.75,
                            }
                      }
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </MotionLink>
              </li>
              )
            })}
          </ul>
        </nav>

        <div className="absolute right-3 flex shrink-0 items-center gap-2 sm:right-4 xl:static">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <a
            href={canAccessAdmin ? '/admin' : '/account'}
            aria-current={
              pathname === '/account' || pathname === '/admin'
                ? 'page'
                : undefined
            }
            className={`hidden min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-extrabold shadow-sm transition hover:-translate-y-0.5 xl:inline-flex ${
              pathname === '/account'
                ? 'bg-navy-900 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            <LogIn size={14} aria-hidden="true" />
            {canAccessAdmin ? 'Dashboard' : user ? 'Account' : 'Sign In'}
            <ArrowUpRight size={13} aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="grid size-11 place-items-center rounded-xl border border-slate-200 text-navy-900 transition hover:border-brand-600 hover:text-brand-600 xl:hidden"
            aria-label={
              isOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            aria-expanded={isOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              <Motion.span
                key={isOpen ? 'close' : 'menu'}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, rotate: -25, scale: 0.8 }
                }
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, rotate: 25, scale: 0.8 }
                }
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.16 }}
                className="grid place-items-center"
                aria-hidden="true"
              >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </Motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <Motion.div
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className={`mobile-navigation-panel section-shell mt-2 origin-top overflow-hidden rounded-2xl border border-slate-200 shadow-2xl xl:hidden ${
              isScrolled
                ? 'h-[calc(100vh-78px)]'
                : 'h-[calc(100vh-86px)]'
            }`}
          >
            <nav
              className="nav-scroll h-full overflow-y-auto p-4"
              aria-label="Mobile navigation"
            >
              <Motion.ul
                variants={{
                  closed: {},
                  open: {
                    transition: {
                      staggerChildren: shouldReduceMotion ? 0 : 0.045,
                    },
                  },
                }}
                className="grid gap-1"
              >
                {links.map((link) => (
                  <Motion.li
                    key={link.label}
                    variants={mobileItemVariants}
                  >
                    <MotionLink
                      to={getLinkHref(link)}
                      onClick={handleLinkClick}
                      whileTap={
                        shouldReduceMotion ? undefined : { scale: 0.985, x: 3 }
                      }
                      aria-current={
                        displayedActiveKey === link.key
                          ? 'location'
                          : undefined
                      }
                      className={`block rounded-xl px-4 py-3.5 text-base font-bold ${
                        displayedActiveKey === link.key
                          ? 'bg-brand-50 text-brand-600'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {link.label}
                    </MotionLink>
                  </Motion.li>
                ))}
              </Motion.ul>
              <MotionLink
                to={canAccessAdmin ? '/admin' : '/account'}
                onClick={() => setIsOpen(false)}
                variants={mobileItemVariants}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
                aria-current={pathname === '/account' ? 'page' : undefined}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20"
              >
                <LogIn size={18} aria-hidden="true" />
                {canAccessAdmin
                  ? 'Open Admin Dashboard'
                  : user
                    ? 'View Account'
                    : 'Log In / Sign Up'}
              </MotionLink>
              <Motion.div
                variants={mobileItemVariants}
                className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 sm:hidden"
              >
                <span className="text-sm font-extrabold text-navy-900">
                  Appearance
                </span>
                <ThemeToggle />
              </Motion.div>
            </nav>
          </Motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
