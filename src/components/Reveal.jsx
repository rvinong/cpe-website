import { motion as Motion } from 'framer-motion'
import { useMotionPreferences } from '../hooks/useMotionPreferences'
import { motionEase, revealViewport } from '../lib/motion'

function Reveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  amount = 0.16,
  distance,
  duration,
  scale = true,
}) {
  const { isCompactMotion, shouldReduceMotion } = useMotionPreferences()
  const motionDistance =
    distance ?? (isCompactMotion ? 14 : direction === 'up' ? 26 : 30)
  const motionDuration = duration ?? (isCompactMotion ? 0.46 : 0.62)
  const motionDelay = isCompactMotion
    ? Math.min(delay * 0.72, 0.14)
    : Math.min(delay, 0.32)
  const offsets = {
    up: { y: motionDistance, x: 0 },
    left: { x: -motionDistance, y: 0 },
    right: { x: motionDistance, y: 0 },
    none: { x: 0, y: 0 },
  }
  const hiddenState = {
    opacity: 0,
    ...offsets[direction],
    scale: scale ? (isCompactMotion ? 0.992 : 0.985) : 1,
    filter: isCompactMotion ? 'blur(0px)' : 'blur(3px)',
  }
  const visibleState = {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
  }

  return (
    <Motion.div
      className={className}
      initial={
        shouldReduceMotion
          ? visibleState
          : hiddenState
      }
      whileInView={visibleState}
      viewport={{ ...revealViewport, amount }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : motionDuration,
        delay: shouldReduceMotion ? 0 : motionDelay,
        ease: motionEase,
      }}
    >
      {children}
    </Motion.div>
  )
}

export default Reveal
