import { motion as Motion } from 'framer-motion'
import { ArrowRight, BookOpen, GraduationCap, ShieldCheck } from 'lucide-react'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

const yearbookHighlights = [
  {
    icon: GraduationCap,
    title: 'Organized by batch',
    description: 'Graduate profiles will be grouped by graduation year.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified records',
    description: 'Only approved information will be added to the archive.',
  },
]

function AlumniSection() {
  return (
    <section id="alumni" className="relative isolate overflow-hidden bg-navy-950 py-24 sm:py-32">
      <div className="subtle-grid absolute inset-0 -z-10 opacity-10" />
      <div className="section-shell">
        <Reveal>
          <SectionHeader
            eyebrow="Our community beyond campus"
            title="Alumni Yearbook"
            description="A growing digital archive for the graduates of the NwSSU Computer Engineering community."
            light
          />
        </Reveal>

        <Reveal delay={0.08} direction="right">
          <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-[0_30px_90px_-55px_rgba(59,130,246,0.75)] backdrop-blur-sm sm:p-9 lg:p-12">
            <div className="subtle-grid absolute inset-0 -z-20 opacity-10" />
            <div className="absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-brand-600/20 blur-3xl" />

            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-extrabold text-blue-200">
                  <BookOpen size={14} aria-hidden="true" />
                  Digital archive
                </span>
                <h3 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Every batch, one shared history
                </h3>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                  Alumni records are currently being collected and verified.
                  Approved graduate profiles will be published in the
                  yearbook as they become available.
                </p>
                <Motion.a
                  href="/alumni"
                  whileHover={{ x: 4 }}
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-950/30 transition-colors hover:bg-brand-500"
                >
                  Open alumni yearbook
                  <ArrowRight size={17} aria-hidden="true" />
                </Motion.a>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {yearbookHighlights.map(({ icon: Icon, title, description }) => (
                  <article
                    key={title}
                    className="rounded-2xl border border-white/10 bg-navy-950/45 p-5"
                  >
                    <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-blue-200">
                      <Icon size={21} aria-hidden="true" />
                    </span>
                    <h4 className="mt-4 font-extrabold text-white">{title}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default AlumniSection
