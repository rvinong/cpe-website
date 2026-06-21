import {
  ArrowRight,
  Briefcase,
  Camera,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import useOrganization from '../context/useOrganization'
import Logo from './Logo'

const quickLinks = [
  'Home',
  'Announcements',
  'Resources',
  'Events',
  'Curriculum',
  'Alumni',
  'News & Gallery',
  'About',
]

const resources = [
  'Reviewers',
  'Lecture Notes',
  'Tutorials',
  'Lab Manuals',
  'Downloads',
  'FAQs',
]

const quickLinkHrefs = {
  Home: '/',
  Announcements: '/announcements',
  Events: '/events',
  Resources: '/student-portal#resources',
  Curriculum: '/student-portal#curriculum',
  Alumni: '/alumni',
  'News & Gallery': '/gallery',
  About: '/about',
}

function Footer() {
  const { profile } = useOrganization()
  const socialLinks = [
    { label: 'Facebook', icon: MessageCircle, href: profile.facebookUrl },
    { label: 'Instagram', icon: Camera, href: profile.instagramUrl },
    { label: 'YouTube', icon: Play, href: profile.youtubeUrl },
    { label: 'LinkedIn', icon: Briefcase, href: profile.linkedinUrl },
  ].filter((link) => link.href)
  const officialSignals = [
    {
      label: 'Official student portal',
      detail: `Managed for the ${profile.name}.`,
      icon: ShieldCheck,
    },
    {
      label: 'Verified information',
      detail: 'Announcements, resources, and records are approved before posting.',
      icon: CheckCircle2,
    },
    {
      label: 'Campus-based community',
      detail: profile.campusAddress || 'Northwest Samar State University',
      icon: MapPin,
    },
  ]

  return (
    <footer
      id="footer"
      className="relative isolate overflow-hidden bg-navy-950 text-white"
    >
      <div className="subtle-grid absolute inset-0 -z-20 opacity-10" />
      <div className="absolute -right-28 top-20 -z-10 size-96 rounded-full bg-brand-600/15 blur-3xl" />

      <div className="section-shell pt-14 sm:pt-18">
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] px-6 py-8 backdrop-blur-sm sm:px-9 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="absolute -right-16 -top-24 -z-10 size-72 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-orange-400">
              <Sparkles size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-extrabold tracking-[0.18em] text-blue-300 uppercase">
                Built for the CPE community
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Everything students need, in one connected portal.
              </h2>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 lg:mt-0">
            <a
              href="/student-portal"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-navy-900 transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Student portal
              <ArrowRight size={17} aria-hidden="true" />
            </a>
            <a
              href="/account?mode=signup"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              Create account
            </a>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {officialSignals.map(({ label, detail, icon: Icon }) => (
            <div
              key={label}
              className="group rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300/35 hover:bg-white/[0.085]"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-blue-200 transition group-hover:bg-brand-600 group-hover:text-white">
                <Icon size={18} aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-extrabold text-white">{label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="section-shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.45fr_0.8fr_0.8fr_1.15fr] lg:gap-10 lg:py-16">
        <div>
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-6 text-slate-400">
            {profile.footerDescription}
          </p>
          {socialLinks.length > 0 && (
            <div className="mt-6 flex gap-2">
              {socialLinks.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid size-10 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:border-blue-400 hover:bg-brand-600 hover:text-white"
                >
                  <Icon size={17} aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-extrabold">Quick Links</h3>
          <ul className="mt-5 space-y-3">
            {quickLinks.map((link) => (
              <li key={link}>
                <a
                  href={quickLinkHrefs[link]}
                  className="text-sm text-slate-400 transition hover:text-white"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div id="resources">
          <h3 className="text-sm font-extrabold">Resources</h3>
          <ul className="mt-5 space-y-3">
            {resources.map((resource) => (
              <li key={resource}>
                <a
                  href="/student-portal#resources"
                  className="text-sm text-slate-400 transition hover:text-white"
                >
                  {resource}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-extrabold">Contact Us</h3>
          <ul className="mt-5 space-y-4 text-sm text-slate-400">
            <li className="flex gap-3">
              <MapPin
                size={17}
                className="mt-0.5 shrink-0 text-blue-300"
                aria-hidden="true"
              />
              {profile.campusAddress}
            </li>
            <li className="flex gap-3">
              <Mail
                size={17}
                className="mt-0.5 shrink-0 text-blue-300"
                aria-hidden="true"
              />
              {profile.contactEmail ? (
                <a
                  href={`mailto:${profile.contactEmail}`}
                  className="hover:text-white"
                >
                  {profile.contactEmail}
                </a>
              ) : (
                'Official email pending verification'
              )}
            </li>
            <li className="flex gap-3">
              <ArrowRight
                size={17}
                className="mt-0.5 shrink-0 text-blue-300"
                aria-hidden="true"
              />
              <a href="/about#contact" className="hover:text-white">
                View contact information
              </a>
            </li>
          </ul>
        </div>

      </div>

      <div className="border-t border-white/10">
        <div className="section-shell flex flex-col gap-3 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p>
              &copy; {new Date().getFullYear()} {profile.name}. All rights
              reserved.
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              Designed and developed by{' '}
              <a
                href="https://github.com/rvinong"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-slate-500 transition hover:text-slate-300"
              >
                Rvin Ong Labrada
              </a>
            </p>
          </div>
          <p>Built for innovation, knowledge, and excellence.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
