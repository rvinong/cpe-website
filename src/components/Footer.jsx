import {
  ArrowRight,
  Briefcase,
  Camera,
  Mail,
  MapPin,
  MessageCircle,
  Play,
} from 'lucide-react'
import { useState } from 'react'
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

const socialLinks = [
  { label: 'Facebook', icon: MessageCircle },
  { label: 'Instagram', icon: Camera },
  { label: 'YouTube', icon: Play },
  { label: 'LinkedIn', icon: Briefcase },
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
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    setMessage('Thanks for joining our newsletter.')
    setEmail('')
  }

  return (
    <footer id="footer" className="bg-navy-950 text-white">
      <div className="section-shell grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.8fr_1.15fr_1.2fr] lg:gap-8 lg:py-20">
        <div>
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-6 text-slate-400">
            Developing capable, ethical, and innovative computer engineers
            through learning, service, and collaboration.
          </p>
          <div className="mt-6 flex gap-2">
            {socialLinks.map(({ label, icon: Icon }) => (
              <a
                key={label}
                href="#footer"
                aria-label={label}
                className="grid size-10 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:border-blue-400 hover:bg-brand-600 hover:text-white"
              >
                <Icon size={17} aria-hidden="true" />
              </a>
            ))}
          </div>
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
              CEA Building, NwSSU Main Campus Calbayog City, Samar
            </li>
            <li className="flex gap-3">
              <Mail
                size={17}
                className="mt-0.5 shrink-0 text-blue-300"
                aria-hidden="true"
              />
              Official email and social channels pending verification
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

        <div id="newsletter">
          <h3 className="text-sm font-extrabold">Newsletter</h3>
          <p className="mt-5 text-sm leading-6 text-slate-400">
            Get organization updates and opportunities delivered to your
            inbox.
          </p>
          <form className="mt-5" onSubmit={handleSubmit}>
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <div className="flex rounded-xl border border-white/10 bg-white/[0.06] p-1.5 focus-within:border-blue-400">
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setMessage('')
                }}
                placeholder="Email address"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <button
                type="submit"
                aria-label="Subscribe to newsletter"
                className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-500"
              >
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
            <p
              className="mt-2 min-h-5 text-xs text-blue-200"
              aria-live="polite"
            >
              {message}
            </p>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="section-shell flex flex-col gap-3 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} NwSSU Computer Engineering
            Organization. All rights reserved.
          </p>
          <p>Built for innovation, knowledge, and excellence.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
