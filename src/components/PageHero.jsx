import { motion as Motion } from 'framer-motion'
import { useMotionPreferences } from '../hooks/useMotionPreferences'
import { motionEase } from '../lib/motion'
import RobotEasterEgg from './RobotEasterEgg'

function PageHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  accentIcon: AccentIcon,
  actions,
  robotVariant = '',
}) {
  const { isCompactMotion, shouldReduceMotion } = useMotionPreferences()

  return (
    <section className="page-hero">
      <div className="page-hero-grid" />
      <div className="page-hero-glow page-hero-glow-primary" />
      <div className="page-hero-glow page-hero-glow-accent" />

      <div className="section-shell relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
        <Motion.div
          initial={
            shouldReduceMotion
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: isCompactMotion ? 14 : 24 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0.01 : isCompactMotion ? 0.48 : 0.6,
            ease: motionEase,
          }}
          className="max-w-4xl"
        >
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="page-title">{title}</h1>
          <p className="page-description">{description}</p>
          {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
        </Motion.div>

        {Icon && (
          <Motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 1, scale: 1, rotate: 0 }
                : {
                    opacity: 0,
                    scale: isCompactMotion ? 0.94 : 0.88,
                    rotate: isCompactMotion ? -2 : -4,
                  }
            }
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              duration: shouldReduceMotion
                ? 0.01
                : isCompactMotion
                  ? 0.48
                  : 0.65,
              delay: shouldReduceMotion ? 0 : isCompactMotion ? 0.04 : 0.1,
              ease: motionEase,
            }}
            className="page-hero-mark"
            aria-hidden="true"
          >
            <span className="page-hero-mark-ring" />
            <Icon size={66} strokeWidth={1.35} />
            {AccentIcon && (
              <AccentIcon
                size={25}
                className="absolute right-7 top-7 text-orange-500"
              />
            )}
          </Motion.div>
        )}
      </div>
      {robotVariant && (
        <RobotEasterEgg variant={robotVariant} size={48} rim="top" />
      )}
    </section>
  )
}

export default PageHero
