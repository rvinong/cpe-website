import { motion as Motion } from 'framer-motion'
import {
  Bell,
  CalendarDays,
  ExternalLink,
  FileText,
  GraduationCap,
  Images,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Newspaper,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AdminActivityCenter from '../components/AdminActivityCenter'
import AdminAnalyticsPanel from '../components/AdminAnalyticsPanel'
import AdminAnnouncements from '../components/AdminAnnouncements'
import AdminAlumni from '../components/AdminAlumni'
import AdminEvents from '../components/AdminEvents'
import AdminInternalAudit from '../components/AdminInternalAudit'
import AdminMedia from '../components/AdminMedia'
import AdminOrganization from '../components/AdminOrganization'
import AdminResources from '../components/AdminResources'
import AdminTeam from '../components/AdminTeam'
import AdminUsers from '../components/AdminUsers'
import Logo from '../components/Logo'
import StaffAvatar from '../components/StaffAvatar'
import ThemeToggle from '../components/ThemeToggle'
import useAuth from '../context/useAuth'
import { useAdminDashboardSignals } from '../hooks/useAdminDashboardSignals'
import { getDisplayName } from '../lib/accountProfile'

const adminSections = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, enabled: true },
  {
    key: 'announcements',
    label: 'Announcements',
    icon: Bell,
    enabled: true,
  },
  { key: 'events', label: 'Events', icon: CalendarDays, enabled: true },
  {
    key: 'media',
    label: 'News & Gallery',
    icon: Images,
    enabled: true,
  },
  {
    key: 'organization',
    label: 'About Content',
    icon: FileText,
    enabled: true,
  },
  { key: 'alumni', label: 'Alumni', icon: GraduationCap, enabled: true },
  { key: 'resources', label: 'Resources', icon: Newspaper, enabled: true },
  {
    key: 'audit',
    label: 'Internal Audit',
    icon: ShieldCheck,
    enabled: true,
  },
  { key: 'team', label: 'Team', icon: ListChecks, enabled: true },
  {
    key: 'users',
    label: 'Users & Roles',
    icon: UsersRound,
    enabled: true,
    requiredRole: 'admin',
  },
]

const contentModules = [
  {
    title: 'Announcements',
    description: 'Create, edit, publish, and archive organization notices.',
    icon: Bell,
    status: 'Available',
    section: 'announcements',
  },
  {
    title: 'Events',
    description: 'Manage schedules, venues, descriptions, and event status.',
    icon: CalendarDays,
    status: 'Available',
    section: 'events',
    action: 'Manage events',
  },
  {
    title: 'News & Gallery',
    description: 'Publish verified stories, albums, and approved photos.',
    icon: Images,
    status: 'Available',
    section: 'media',
    action: 'Manage news & gallery',
  },
  {
    title: 'Organization Profile',
    description: 'Update officers, mission, vision, history, and contacts.',
    icon: Settings,
    status: 'Available',
    section: 'organization',
    action: 'Manage organization profile',
  },
  {
    title: 'Alumni',
    description: 'Maintain yearbook profiles and graduate spotlights.',
    icon: GraduationCap,
    status: 'Available',
    section: 'alumni',
    action: 'Manage alumni',
  },
  {
    title: 'Student Resources',
    description: 'Publish approved files and links for verified members.',
    icon: Newspaper,
    status: 'Available',
    section: 'resources',
    action: 'Manage resources',
  },
  {
    title: 'Internal Audit',
    description: 'Publish transparency reports, liquidations, and resolutions.',
    icon: ShieldCheck,
    status: 'Available',
    section: 'audit',
    action: 'Manage audit reports',
  },
  {
    title: 'Team Management',
    description: 'Assign editor tasks and keep staff profiles familiar.',
    icon: ListChecks,
    status: 'Available',
    section: 'team',
    action: 'Manage team',
  },
  {
    title: 'Users & Roles',
    description: 'Approve accounts and assign student, editor, or admin roles.',
    icon: UsersRound,
    status: 'Admin only',
    section: 'users',
    action: 'Manage users',
    requiredRole: 'admin',
  },
]

const sectionTitles = {
  overview: 'Dashboard Overview',
  announcements: 'Manage Announcements',
  events: 'Manage Events',
  media: 'Manage News & Gallery',
  organization: 'Manage About Content',
  alumni: 'Manage Alumni',
  resources: 'Manage Resources',
  audit: 'Manage Internal Audit',
  team: 'Manage Team',
  users: 'Manage Users & Roles',
}

const sectionDescriptions = {
  overview: 'Monitor content, schedules, and team priorities.',
  announcements: 'Draft, publish, feature, and archive notices.',
  events: 'Keep schedules and registration details accurate.',
  media: 'Manage verified stories, albums, and approved photos.',
  organization: 'Maintain public organization records and leadership.',
  alumni: 'Curate verified graduate profiles and spotlights.',
  resources: 'Publish approved learning files and external links.',
  audit: 'Manage transparency reports, liquidations, and resolutions.',
  team: 'Coordinate assignments and staff profile information.',
  users: 'Approve accounts and manage role-based access.',
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, profile, signOut } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [message, setMessage] = useState('')
  const visibleSections = useMemo(
    () =>
      adminSections.filter(
        (section) =>
          section.enabled &&
          (!section.requiredRole || profile?.role === section.requiredRole),
      ),
    [profile?.role],
  )
  const requestedSection = searchParams.get('section') || 'overview'
  const activeSection = visibleSections.some(
    (section) => section.key === requestedSection,
  )
    ? requestedSection
    : 'overview'
  const activeSectionConfig =
    visibleSections.find((section) => section.key === activeSection) ||
    visibleSections[0]
  const ActiveSectionIcon = activeSectionConfig?.icon || LayoutDashboard
  const {
    dashboardSignals,
    isLoading: isLoadingDashboardSignals,
    loadedAt: dashboardSignalsLoadedAt,
    sourceError: dashboardSignalsError,
  } = useAdminDashboardSignals(activeSection === 'overview')

  useEffect(() => {
    if (!isSidebarOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsSidebarOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isSidebarOpen])

  const selectSection = (sectionKey) => {
    const targetSection = adminSections.find(
      (section) => section.key === sectionKey,
    )
    const canOpen =
      targetSection?.enabled &&
      (!targetSection.requiredRole || profile?.role === targetSection.requiredRole)

    if (!canOpen) return

    setMessage('')
    setSearchParams(sectionKey === 'overview' ? {} : { section: sectionKey })
    setIsSidebarOpen(false)
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
  }

  const handleSignOut = async () => {
    const { error } = await signOut()

    if (error) {
      setMessage(error.message)
      return
    }

    navigate('/')
  }

  const displayName = getDisplayName(profile, user, 'Administrator')

  return (
    <div className="admin-dashboard min-h-screen overflow-x-clip bg-slate-50">
      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-navy-950 text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <Logo light />
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="grid size-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-white lg:hidden"
            aria-label="Close admin navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[calc(100vh-4rem)] flex-col p-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3">
            <div className="flex items-center gap-3">
              <StaffAvatar
                path={profile?.avatar_path}
                name={displayName}
                className="size-11 rounded-xl"
                textClassName="text-xs"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-white">
                  {displayName}
                </p>
                <p className="mt-0.5 text-xs font-bold text-blue-300 capitalize">
                  {profile?.role} access
                </p>
              </div>
            </div>
            <Link
              to="/account"
              onClick={() => setIsSidebarOpen(false)}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-xs font-extrabold text-blue-100 transition hover:border-blue-300/40 hover:bg-white/10 hover:text-white"
            >
              <UserRound size={15} aria-hidden="true" />
              My Account
            </Link>
          </div>

          <nav className="nav-scroll mt-3 flex-1 overflow-y-auto">
            <p className="px-3 text-[10px] font-extrabold tracking-[0.18em] text-slate-500 uppercase">
              Content management
            </p>
            <ul className="mt-2 grid gap-1">
              {adminSections.map(
                ({
                  key,
                  label,
                  icon: Icon,
                  enabled = false,
                  requiredRole,
                }) => {
                  const sectionKey = key || label
                  const isActive = activeSection === sectionKey
                  const canOpen =
                    enabled && (!requiredRole || profile?.role === requiredRole)

                  return (
                    <li key={label}>
                      <button
                        type="button"
                        disabled={!canOpen}
                        onClick={() => selectSection(sectionKey)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
                          isActive
                            ? 'bg-brand-600 text-white shadow-lg shadow-blue-950/35'
                            : canOpen
                              ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                              : 'cursor-not-allowed text-slate-600 opacity-65'
                        }`}
                      >
                        <Icon size={18} aria-hidden="true" />
                        {label}
                      </button>
                    </li>
                  )
                },
              )}
            </ul>
          </nav>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-extrabold text-slate-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut size={17} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-navy-950/65 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close admin navigation overlay"
        />
      )}

      <div className="lg:pl-64">
        <header className="admin-topbar sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-3 backdrop-blur-xl sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-navy-900 lg:hidden"
              aria-label="Open admin navigation"
            >
              <Menu size={20} />
            </button>
            <span className="hidden size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 sm:grid">
              <ActiveSectionIcon size={19} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold tracking-[0.15em] text-brand-600 uppercase">
                Administration
              </p>
              <h1 className="truncate text-base font-black text-navy-900 sm:text-lg">
                {sectionTitles[activeSection] || 'Dashboard Overview'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="admin-section-switcher">
              Switch dashboard section
            </label>
            <select
              id="admin-section-switcher"
              value={activeSection}
              onChange={(event) => selectSection(event.target.value)}
              className="hidden h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-600 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 md:block"
            >
              {visibleSections.map((section) => (
                <option key={section.key} value={section.key}>
                  {section.label}
                </option>
              ))}
            </select>
            <Link
              to="/"
              target="_blank"
              className="hidden size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-brand-500 hover:text-brand-600 sm:grid"
              aria-label="Open public website"
            >
              <ExternalLink size={17} aria-hidden="true" />
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <nav
          className="admin-mobile-tabs nav-scroll sticky top-16 z-20 flex gap-2 overflow-x-auto border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur-xl md:hidden"
          aria-label="Dashboard sections"
        >
          {visibleSections.map(({ key, label, icon: Icon }) => {
            const isActive = activeSection === key

            return (
              <button
                key={key}
                type="button"
                onClick={() => selectSection(key)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold transition ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-blue-600/20'
                    : 'border border-slate-200 bg-white text-slate-600'
                }`}
              >
                <Icon size={15} aria-hidden="true" />
                {label}
              </button>
            )
          })}
        </nav>

        <main className="px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
          <Motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
          {activeSection === 'announcements' ? (
            <AdminAnnouncements />
          ) : activeSection === 'events' ? (
            <AdminEvents />
          ) : activeSection === 'media' ? (
            <AdminMedia />
          ) : activeSection === 'organization' ? (
            <AdminOrganization />
          ) : activeSection === 'alumni' ? (
            <AdminAlumni />
          ) : activeSection === 'resources' ? (
            <AdminResources />
          ) : activeSection === 'audit' ? (
            <AdminInternalAudit />
          ) : activeSection === 'team' ? (
            <AdminTeam />
          ) : activeSection === 'users' && profile?.role === 'admin' ? (
            <AdminUsers />
          ) : (
            <div className="admin-overview mx-auto max-w-7xl">
              <section className="admin-welcome relative isolate overflow-hidden rounded-3xl bg-navy-950 px-5 py-6 text-white shadow-[0_30px_80px_-45px_rgba(7,21,47,0.75)] sm:px-7 lg:py-7">
                <div className="subtle-grid absolute inset-0 -z-20 opacity-10" />
                <div className="absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-brand-600/25 blur-3xl" />
                <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <p className="text-xs font-extrabold tracking-[0.2em] text-blue-300 uppercase">
                      Your organization workspace
                    </p>
                    <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                      Welcome, {displayName}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                      {sectionDescriptions.overview} Publish updates, review
                      activity, and keep the public website current from one
                      role-protected workspace.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => selectSection('announcements')}
                        className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-navy-900 transition hover:-translate-y-0.5 hover:bg-blue-50"
                      >
                        Publish an update
                      </button>
                      <button
                        type="button"
                        onClick={() => selectSection('team')}
                        className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
                      >
                        Open team tasks
                      </button>
                    </div>
                  </div>
                  <span className="grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/10 text-blue-200">
                    <ShieldCheck size={30} aria-hidden="true" />
                  </span>
                </div>
              </section>

              <AdminActivityCenter
                dashboardSignals={dashboardSignals}
                isLoading={isLoadingDashboardSignals}
                onSelectSection={selectSection}
                role={profile?.role}
                sourceError={dashboardSignalsError}
              />

              <AdminAnalyticsPanel
                dashboardSignals={dashboardSignals}
                isLoading={isLoadingDashboardSignals}
                referenceTime={dashboardSignalsLoadedAt}
                onSelectSection={selectSection}
                role={profile?.role}
              />

              <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Connection', 'Supabase', 'Configured'],
                  ['Session', user ? 'Active' : 'None', user?.email],
                  ['Role', profile?.role || 'Unknown', 'Verified by database'],
                  ['Profile', profile?.status || 'Pending', 'Account status'],
                ].map(([label, value, detail]) => (
                  <article
                    key={label}
                    className="surface-card interactive-card p-4"
                  >
                    <p className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-black capitalize text-navy-900">
                      {value}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {detail}
                    </p>
                  </article>
                ))}
              </section>

              <section className="mt-6">
                <div className="max-w-2xl">
                  <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
                    Management modules
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-navy-900 sm:text-3xl">
                    Content control center
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Each module replaces local mock data with approved database
                    content.
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {contentModules.map(
                    ({
                      title,
                      description,
                      icon: Icon,
                      status,
                      section,
                      action,
                      requiredRole,
                    }) => (
                      <article
                        key={title}
                        className="surface-card interactive-card group flex flex-col p-3.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                            <Icon size={22} aria-hidden="true" />
                          </span>
                          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-brand-600 uppercase">
                            {status}
                          </span>
                        </div>
                        <h3 className="mt-3 text-lg font-black text-navy-900">
                          {title}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {description}
                        </p>
                        {section && (
                          <button
                            type="button"
                            onClick={() => selectSection(section)}
                            disabled={
                              Boolean(requiredRole) &&
                              profile?.role !== requiredRole
                            }
                            className="mt-3 inline-flex items-center justify-center self-start rounded-xl bg-brand-600 px-3 py-2 text-[11px] font-extrabold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {requiredRole && profile?.role !== requiredRole
                              ? 'Administrator required'
                              : action || 'Manage announcements'}
                          </button>
                        )}
                      </article>
                    ),
                  )}
                </div>
              </section>

              <section className="mt-6 rounded-3xl border border-blue-300 bg-brand-50/45 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
                      Security checkpoint
                    </p>
                    <h2 className="mt-2 text-xl font-black text-navy-900">
                      Dashboard access is role protected
                    </h2>
                    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
                      Public users cannot open this route. Supabase Row Level
                      Security remains the final authority for every database
                      operation.
                    </p>
                  </div>
                  <a
                    href="/"
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-brand-700"
                  >
                    View public site
                  </a>
                </div>
              </section>

              <p className="mt-4 min-h-5 text-center text-sm font-bold text-red-600">
                {message}
              </p>
            </div>
          )}
          </Motion.div>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
