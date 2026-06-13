import { motion as Motion } from 'framer-motion'
import { ArrowRight, CircuitBoard, UsersRound } from 'lucide-react'
import useOrganization from '../context/useOrganization'

function Hero() {
  const { profile, stats } = useOrganization()

  return (
    <section
      id="home"
      className="relative isolate overflow-hidden bg-slate-100 pt-[72px]"
    >
      <div className="absolute inset-x-0 bottom-0 top-[72px] -z-30 overflow-hidden">
        <Motion.img
          src="/images/nwssu-cpe-hero.jpg"
          alt={`${profile.name} students gathered at a chapter event`}
          width="1920"
          height="1080"
          fetchPriority="high"
          className="h-full w-full object-cover object-[55%_center] sm:object-center"
          initial={{ opacity: 0, scale: 1.035 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 top-[72px] -z-20 bg-white/15 sm:bg-white/5 lg:bg-transparent" />
      <div className="absolute inset-x-0 bottom-0 top-[72px] -z-10 bg-gradient-to-r from-white/95 via-white/55 to-white/5 sm:from-white/90 sm:via-white/40 lg:from-white/95 lg:via-white/55 lg:to-transparent" />
      <div className="subtle-grid absolute inset-x-0 bottom-0 top-[72px] -z-10 opacity-35" />

      <div className="section-shell flex min-h-[760px] items-center py-14 sm:min-h-[800px] sm:py-18 lg:min-h-[760px] lg:py-20">
        <div className="max-w-3xl">
          <Motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3 py-2 text-[10px] font-extrabold tracking-[0.12em] text-brand-600 uppercase shadow-sm backdrop-blur sm:px-4 sm:text-[11px] sm:tracking-[0.2em]"
          >
            <CircuitBoard size={15} aria-hidden="true" />
            {profile.name}
          </Motion.div>

          <Motion.h1
            initial={{ opacity: 0, x: -35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.75,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-[clamp(3rem,7vw,5.8rem)] font-black leading-[0.88] tracking-[-0.065em] text-navy-900"
          >
            <span className="block">Innovation.</span>
            <span className="block">Knowledge.</span>
            <span className="block text-brand-600">Excellence.</span>
          </Motion.h1>

          <Motion.p
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg leading-8 text-slate-700"
          >
            Empowering students through innovation, leadership,
            collaboration, and academic excellence.
          </Motion.p>

          <Motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="mt-7 flex flex-col gap-3 sm:flex-row"
          >
            <Motion.a
              href="/about"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-4 text-sm font-extrabold text-white shadow-xl shadow-blue-600/20 transition-colors hover:bg-brand-700"
            >
              Explore Our Organization
              <ArrowRight size={18} aria-hidden="true" />
            </Motion.a>
            <Motion.a
              href="/account?mode=signup"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/90 px-6 py-4 text-sm font-extrabold text-navy-900 shadow-sm backdrop-blur transition-colors hover:border-brand-600 hover:text-brand-600"
            >
              <UsersRound size={18} aria-hidden="true" />
              Join Now
            </Motion.a>
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.7 }}
            className="mt-7 flex items-center gap-4 text-sm text-slate-600"
          >
            <span className="flex -space-x-2" aria-hidden="true">
              {['CP', 'ES', 'AI'].map((initials, index) => (
                <span
                  key={initials}
                  className={`grid size-9 place-items-center rounded-full border-2 border-white text-[9px] font-black text-white ${
                    ['bg-brand-600', 'bg-indigo-500', 'bg-emerald-500'][index]
                  }`}
                >
                  {initials}
                </span>
              ))}
            </span>
            <span>
              <strong className="font-extrabold text-navy-900">
                {stats.members.value}
                {stats.members.suffix}
              </strong>{' '}
              student innovators
            </span>
          </Motion.div>
        </div>
      </div>
    </section>
  )
}

export default Hero
