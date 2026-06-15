import {
  ArrowRight,
  Award,
  CalendarCheck,
  LibraryBig,
  UsersRound,
} from 'lucide-react'
import useOrganization from '../context/useOrganization'
import AnimatedCounter from './AnimatedCounter'
import Reveal from './Reveal'

const iconMap = {
  award: Award,
  calendar: CalendarCheck,
  users: UsersRound,
  library: LibraryBig,
}

function GlanceSection() {
  const { profile, stats } = useOrganization()
  const glanceStats = [
    { ...stats.years, label: 'Years of Excellence', icon: 'award' },
    { ...stats.events, label: 'Events & Activities', icon: 'calendar' },
    { ...stats.members, label: 'Active Members', icon: 'users' },
    {
      ...stats.curriculumUnits,
      label: 'Curriculum Units',
      icon: 'library',
    },
  ]

  return (
    <section id="about" className="bg-white py-12 pb-24 sm:pb-32">
      <div className="section-shell">
        <Reveal direction="left">
          <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-navy-950 px-6 py-14 shadow-[0_34px_80px_-40px_rgba(7,21,47,0.85)] sm:px-10 lg:px-14 lg:py-18">
            <img
              src="/images/ce-campus-hero.jpg"
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-950 via-navy-900/95 to-brand-700/85" />
            <div className="absolute -top-24 right-0 -z-10 size-80 rounded-full bg-blue-400/15 blur-3xl" />

            <div className="max-w-3xl">
              <p className="text-xs font-extrabold tracking-[0.22em] text-blue-200 uppercase">
                Who we are
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                {profile.glanceHeading}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100/80 sm:text-lg">
                {profile.glanceDescription}
              </p>
              <a
                href="/about"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-navy-900 transition hover:bg-blue-50"
              >
                Learn more about us
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {glanceStats.map((stat, index) => {
                const Icon = iconMap[stat.icon]

                return (
                  <Reveal key={stat.label} delay={0.08 + index * 0.07}>
                    <div className="h-full rounded-2xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur-sm">
                      <Icon
                        className="text-blue-200"
                        size={23}
                        strokeWidth={1.7}
                        aria-hidden="true"
                      />
                      <AnimatedCounter
                        value={stat.value}
                        suffix={stat.suffix}
                        className="mt-5 block text-3xl font-black tracking-tight text-white"
                      />
                      <p className="mt-1 text-sm font-medium text-blue-100/75">
                        {stat.label}
                      </p>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default GlanceSection
