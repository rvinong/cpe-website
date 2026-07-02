import {
  Braces,
  CircuitBoard,
  Cpu,
  Network,
} from 'lucide-react'
import { motion as Motion } from 'framer-motion'
import { electiveTracks } from '../data/curriculum'
import { springTransition } from '../lib/motion'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

const trackStyles = {
  'embedded-systems': {
    icon: Cpu,
    accent: 'bg-violet-50 text-violet-600 ring-violet-100',
  },
  'network-administration': {
    icon: Network,
    accent: 'bg-amber-50 text-amber-600 ring-amber-100',
  },
  microelectronics: {
    icon: CircuitBoard,
    accent: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  },
  'software-development': {
    icon: Braces,
    accent: 'bg-blue-50 text-blue-600 ring-blue-100',
  },
}

function FeaturedPrograms() {
  return (
    <section id="programs" className="bg-white py-24 sm:py-32">
      <div className="section-shell">
        <Reveal>
          <SectionHeader
            eyebrow="Curriculum focus"
            title="Elective Tracks"
            description="Tracks listed in the supplied BS Computer Engineering curriculum."
            centered
          />
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {electiveTracks.map((track, index) => {
            const style = trackStyles[track.id] ?? trackStyles['software-development']
            const Icon = style.icon

            return (
              <Reveal
                key={track.id}
                delay={index * 0.07}
                direction={index % 2 === 0 ? 'left' : 'right'}
              >
                <Motion.article
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.988 }}
                  transition={springTransition}
                  className="surface-card h-full p-7 transition hover:border-brand-500 hover:shadow-[0_26px_65px_-36px_rgba(21,94,239,0.3)]"
                >
                  <span
                    className={`grid size-13 place-items-center rounded-2xl ring-1 ${style.accent}`}
                  >
                    <Icon size={24} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-xl font-extrabold text-navy-900">
                    {track.title}
                  </h3>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                    {track.courses.map((course) => (
                      <li key={course} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" />
                        <span>{course}</span>
                      </li>
                    ))}
                  </ul>
                </Motion.article>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FeaturedPrograms
