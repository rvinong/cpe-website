import {
  Award,
  CalendarCheck,
  Handshake,
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
  handshake: Handshake,
}

function StatsStrip() {
  const { stats } = useOrganization()
  const stripStats = [
    { ...stats.years, label: 'Years', icon: 'award' },
    { ...stats.events, label: 'Events', icon: 'calendar' },
    { ...stats.members, label: 'Members', icon: 'users' },
    {
      ...stats.curriculumUnits,
      label: 'Curriculum Units',
      icon: 'library',
    },
    { ...stats.partners, label: 'Partners', icon: 'handshake' },
  ]

  return (
    <section className="relative isolate overflow-hidden bg-brand-600 py-16">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-700 to-brand-500" />
      <div className="absolute top-0 left-1/3 -z-10 h-56 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="section-shell grid grid-cols-2 gap-8 text-white sm:grid-cols-3 lg:grid-cols-5">
        {stripStats.map((stat, index) => {
          const Icon = iconMap[stat.icon]

          return (
            <Reveal key={stat.label} delay={index * 0.06}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-5 text-center backdrop-blur-sm">
                <Icon
                  size={22}
                  className="mx-auto text-blue-100"
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  className="mt-3 block text-3xl font-black tracking-tight sm:text-4xl"
                />
                <p className="mt-1 text-xs font-bold tracking-wide text-blue-100/80 uppercase">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

export default StatsStrip
