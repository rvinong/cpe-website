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

function GitHubIcon({ size = 13 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .7a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.04c-3.34.72-4.04-1.42-4.04-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .7Z" />
    </svg>
  )
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
        <div className="grid gap-3 md:grid-cols-3">
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
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-600">
              <span>Designed and developed by</span>
              <span className="font-bold text-slate-500">
                Rvin Ong Labrada
              </span>
              <a
                href="https://github.com/rvinong"
                target="_blank"
                rel="noreferrer"
                aria-label="Visit Rvin Ong Labrada on GitHub"
                className="grid size-6 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-slate-500 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-slate-300"
              >
                <GitHubIcon />
              </a>
            </div>
          </div>
          <p>Built for innovation, knowledge, and excellence.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
