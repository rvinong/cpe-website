import {
  Bell,
  CalendarDays,
  FileText,
  GraduationCap,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Settings,
  ShieldCheck,
  UserRoundCog,
  UsersRound,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminAnnouncements from '../components/AdminAnnouncements'
import AdminAlumni from '../components/AdminAlumni'
import AdminEvents from '../components/AdminEvents'
import AdminMedia from '../components/AdminMedia'
import AdminOrganization from '../components/AdminOrganization'
import AdminResources from '../components/AdminResources'
import AdminUsers from '../components/AdminUsers'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import useAuth from '../context/useAuth'

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
  announcements: 'Manage Announcements',
  events: 'Manage Events',
  media: 'Manage News & Gallery',
  organization: 'Manage About Content',
  alumni: 'Manage Alumni',
  resources: 'Manage Resources',
  users: 'Manage Users & Roles',
}

function AdminDashboard() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [message, setMessage] = useState('')

  const handleSignOut = async () => {
    const { error } = await signOut()

    if (error) {
      setMessage(error.message)
      return
    }

    navigate('/')
  }

  const displayName =
    profile?.full_name || user?.email?.split('@')[0] || 'Administrator'

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-slate-200 px-5">
          <Logo />
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="grid size-10 place-items-center rounded-lg border border-slate-200 text-navy-900 lg:hidden"
            aria-label="Close admin navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[calc(100vh-72px)] flex-col p-4">
          <div className="rounded-2xl bg-brand-50 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-600 text-white">
                <UserRoundCog size={21} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-navy-900">
                  {displayName}
                </p>
                <p className="mt-0.5 text-xs font-bold text-brand-600 capitalize">
                  {profile?.role} access
                </p>
              </div>
            </div>
          </div>

          <nav className="nav-scroll mt-5 flex-1 overflow-y-auto">
            <p className="px-3 text-[10px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
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
                        onClick={() => {
                          setActiveSection(sectionKey)
                          setIsSidebarOpen(false)
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                          isActive
                            ? 'bg-brand-600 text-white shadow-md shadow-blue-600/15'
                            : canOpen
                              ? 'text-slate-600 hover:bg-brand-50 hover:text-brand-600'
                              : 'cursor-not-allowed text-slate-500 opacity-65'
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
            className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
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

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="grid size-10 place-items-center rounded-lg border border-slate-200 text-navy-900 lg:hidden"
              aria-label="Open admin navigation"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-xs font-extrabold tracking-[0.15em] text-brand-600 uppercase">
                Administration
              </p>
              <h1 className="text-lg font-black text-navy-900">
                {sectionTitles[activeSection] || 'Dashboard Overview'}
              </h1>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
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
          ) : activeSection === 'users' && profile?.role === 'admin' ? (
            <AdminUsers />
          ) : (
            <div className="mx-auto max-w-7xl">
              <section className="relative isolate overflow-hidden rounded-3xl bg-navy-950 px-6 py-9 text-white shadow-[0_30px_80px_-45px_rgba(7,21,47,0.75)] sm:px-9">
                <div className="subtle-grid absolute inset-0 -z-20 opacity-10" />
                <div className="absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-brand-600/25 blur-3xl" />
                <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <p className="text-xs font-extrabold tracking-[0.2em] text-blue-300 uppercase">
                      Backend foundation connected
                    </p>
                    <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                      Welcome, {displayName}
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                      Authentication, session persistence, and role-protected
                      dashboard access are active. Public organization content
                      can now be managed from this control center.
                    </p>
                  </div>
                  <span className="grid size-20 place-items-center rounded-3xl border border-white/10 bg-white/10 text-blue-200">
                    <ShieldCheck size={36} aria-hidden="true" />
                  </span>
                </div>
              </section>

              <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Connection', 'Supabase', 'Configured'],
                  ['Session', user ? 'Active' : 'None', user?.email],
                  ['Role', profile?.role || 'Unknown', 'Verified by database'],
                  ['Profile', profile?.status || 'Pending', 'Account status'],
                ].map(([label, value, detail]) => (
                  <article
                    key={label}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.28)]"
                  >
                    <p className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                      {label}
                    </p>
                    <p className="mt-3 text-2xl font-black capitalize text-navy-900">
                      {value}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {detail}
                    </p>
                  </article>
                ))}
              </section>

              <section className="mt-10">
                <div className="max-w-2xl">
                  <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
                    Management modules
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-navy-900">
                    Content control center
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Each module replaces local mock data with approved database
                    content.
                  </p>
                </div>

              <div className="mt-7 grid gap-5 md:grid-cols-2">
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
                      className="rounded-2xl border border-slate-200 bg-white p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                          <Icon size={22} aria-hidden="true" />
                        </span>
                        <span className="rounded-full bg-brand-50 px-3 py-1.5 text-[10px] font-extrabold tracking-wide text-brand-600 uppercase">
                          {status}
                        </span>
                      </div>
                      <h3 className="mt-5 text-xl font-black text-navy-900">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {description}
                      </p>
                      {section && (
                        <button
                          type="button"
                          onClick={() => setActiveSection(section)}
                          disabled={
                            Boolean(requiredRole) &&
                            profile?.role !== requiredRole
                          }
                          className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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

              <section className="mt-10 rounded-3xl border border-blue-100 bg-brand-50/45 p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
                    Security checkpoint
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-navy-900">
                    Dashboard access is role protected
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Public users cannot open this route. Supabase Row Level
                    Security remains the final authority for every database
                    operation.
                  </p>
                </div>
                <a
                  href="/"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-brand-700"
                >
                  View public site
                </a>
              </div>
              </section>

              <p className="mt-5 min-h-5 text-center text-sm font-bold text-red-600">
                {message}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
