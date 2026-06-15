import {
  Braces,
  CircuitBoard,
  Cpu,
  Network,
} from 'lucide-react'
import { motion as Motion } from 'framer-motion'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

const programs = [
  {
    title: 'Programming',
    description:
      'Build reliable software, algorithms, and modern digital experiences.',
    icon: Braces,
    accent: 'bg-blue-50 text-blue-600 ring-blue-100',
  },
  {
    title: 'Electronics',
    description:
      'Explore circuits, digital logic, instrumentation, and hardware design.',
    icon: CircuitBoard,
    accent: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  },
  {
    title: 'Networking',
    description:
      'Understand connected systems, infrastructure, and cybersecurity.',
    icon: Network,
    accent: 'bg-amber-50 text-amber-600 ring-amber-100',
  },
  {
    title: 'Embedded Systems',
    description:
      'Create intelligent devices through firmware and microcontrollers.',
    icon: Cpu,
    accent: 'bg-violet-50 text-violet-600 ring-violet-100',
  },
]

function FeaturedPrograms() {
  return (
    <section id="programs" className="bg-white py-24 sm:py-32">
      <div className="section-shell">
        <Reveal>
          <SectionHeader
            eyebrow="Academic focus"
            title="Featured Programs"
            description="Core learning areas that shape versatile and industry-ready computer engineers."
            centered
          />
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {programs.map((program, index) => {
            const Icon = program.icon

            return (
              <Reveal
                key={program.title}
                delay={index * 0.07}
                direction={index % 2 === 0 ? 'left' : 'right'}
              >
                <Motion.article
                  whileHover={{ y: -6 }}
                  className="surface-card h-full p-7 transition hover:border-brand-500 hover:shadow-[0_26px_65px_-36px_rgba(21,94,239,0.3)]"
                >
                  <span
                    className={`grid size-13 place-items-center rounded-2xl ring-1 ${program.accent}`}
                  >
                    <Icon size={24} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-xl font-extrabold text-navy-900">
                    {program.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {program.description}
                  </p>
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
