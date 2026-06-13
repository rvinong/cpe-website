import {
  BookOpen,
  GraduationCap,
  Images,
  Info,
  Shirt,
  UsersRound,
} from 'lucide-react'
import { motion as Motion } from 'framer-motion'
import { quickAccessItems } from '../data/quickAccess'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

const iconMap = {
  book: BookOpen,
  graduation: GraduationCap,
  images: Images,
  users: UsersRound,
  shirt: Shirt,
  info: Info,
}

function QuickAccess() {
  return (
    <section id="quick-access" className="bg-white py-24 sm:py-28">
      <div className="section-shell">
        <Reveal>
          <SectionHeader
            eyebrow="Student portal"
            title="Quick Access"
            description="Everything you need, all in one place."
            centered
          />
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {quickAccessItems.map((item, index) => {
            const Icon = iconMap[item.icon]

            return (
              <Reveal key={item.title} delay={index * 0.055}>
                <Motion.a
                  href={item.href}
                  whileHover={{ y: -5 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 23 }}
                  className="group flex h-full min-h-48 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-colors duration-300 hover:border-brand-500 hover:bg-brand-50/40"
                >
                  <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-transform duration-300 group-hover:-translate-y-1 group-hover:bg-brand-600 group-hover:text-white">
                    <Icon size={23} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-base font-extrabold text-navy-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-slate-500">
                    {item.description}
                  </p>
                </Motion.a>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default QuickAccess
