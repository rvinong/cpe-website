import { AnimatePresence, motion as Motion } from 'framer-motion'
import { LogIn, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import useAuth from '../context/useAuth'
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

function Navbar() {
  const { pathname } = useLocation()
  const { user, canAccessAdmin } = useAuth()
  const isHomePage = pathname === '/'
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeKey, setActiveKey] = useState(
    pathname.startsWith('/announcements')
      ? 'announcements'
      : pathname === '/alumni'
        ? 'alumni'
      : pathname === '/about'
        ? 'about'
      : pathname === '/gallery'
        ? 'gallery'
      : pathname === '/events'
        ? 'events'
        : 'home',
  )
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
          : activeKey

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
    const handleScroll = () => setIsScrolled(window.scrollY > 12)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleLinkClick = (key) => {
    setActiveKey(key)
    setIsOpen(false)
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        isScrolled
          ? 'border-slate-200/90 bg-white/95 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl'
          : 'border-slate-200/70 bg-white/90 backdrop-blur-lg'
      }`}
    >
      <div className="section-shell flex h-[72px] items-center justify-between gap-5">
        <Logo />

        <nav aria-label="Primary navigation" className="hidden xl:block">
          <ul className="flex items-center gap-6">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={getLinkHref(link)}
                  onClick={() => handleLinkClick(link.key)}
                  aria-current={
                    displayedActiveKey === link.key ? 'location' : undefined
                  }
                  className={`relative py-6 text-[13px] font-bold transition-colors ${
                    displayedActiveKey === link.key
                      ? 'text-brand-600'
                      : 'text-slate-600 hover:text-brand-600'
                  }`}
                >
                  {link.label}
                  {displayedActiveKey === link.key && (
                    <Motion.span
                      layoutId="active-nav"
                      className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-600"
                    />
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <a
            href={canAccessAdmin ? '/admin' : '/account'}
            aria-current={
              pathname === '/account' || pathname === '/admin'
                ? 'page'
                : undefined
            }
            className={`hidden shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-extrabold shadow-sm transition xl:inline-flex ${
              pathname === '/account'
                ? 'bg-navy-900 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            <LogIn size={14} aria-hidden="true" />
            {canAccessAdmin ? 'Dashboard' : user ? 'Account' : 'Sign In'}
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
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'calc(100vh - 72px)' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-slate-100 bg-white xl:hidden"
          >
            <nav
              className="nav-scroll section-shell h-full overflow-y-auto py-6"
              aria-label="Mobile navigation"
            >
              <ul className="grid gap-1">
                {links.map((link, index) => (
                  <Motion.li
                    key={link.label}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.035 }}
                  >
                    <a
                      href={getLinkHref(link)}
                      onClick={() => handleLinkClick(link.key)}
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
                    </a>
                  </Motion.li>
                ))}
              </ul>
              <a
                href={canAccessAdmin ? '/admin' : '/account'}
                onClick={() => setIsOpen(false)}
                aria-current={pathname === '/account' ? 'page' : undefined}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20"
              >
                <LogIn size={18} aria-hidden="true" />
                {canAccessAdmin
                  ? 'Open Admin Dashboard'
                  : user
                    ? 'View Account'
                    : 'Log In / Sign Up'}
              </a>
            </nav>
          </Motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
