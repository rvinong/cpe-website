import {
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  Images,
  Info,
  Shirt,
  UsersRound,
} from 'lucide-react'
import { motion as Motion } from 'framer-motion'
import { quickAccessItems } from '../data/quickAccess'
import { springTransition } from '../lib/motion'
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
    <section id="quick-access" className="bg-white py-24 sm:py-32">
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
                  aria-label={`Open ${item.title}`}
                  whileHover={{ y: -7, scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  transition={springTransition}
                  className="quick-access-card surface-card group relative flex h-full min-h-52 flex-col overflow-hidden p-6 transition duration-300 hover:border-brand-500 hover:shadow-[0_28px_70px_-38px_rgba(21,94,239,0.5)] focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-100"
                >
                  <span className="absolute inset-x-6 top-0 h-px bg-brand-500 opacity-0 transition duration-500 group-hover:opacity-100" />
                  <span className="quick-access-orb absolute -right-8 -top-8 size-28 rounded-full transition duration-500" />
                  <span className="quick-access-ember absolute -bottom-10 left-6 h-16 w-28 rotate-[-12deg] rounded-full opacity-0 blur-2xl transition duration-500 group-hover:opacity-80" />
                  <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:bg-brand-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-600/20">
                    <Icon size={23} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <h3 className="relative mt-6 text-base font-extrabold text-navy-900">
                    {item.title}
                  </h3>
                  <p className="relative mt-2 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                  <span className="relative mt-auto inline-flex items-center gap-1 pt-5 text-xs font-extrabold text-brand-600 opacity-0 transition duration-300 group-hover:translate-x-1 group-hover:opacity-100 group-focus-visible:translate-x-1 group-focus-visible:opacity-100">
                    Open
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </span>
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
