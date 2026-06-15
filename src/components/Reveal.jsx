import { motion as Motion, useReducedMotion } from 'framer-motion'

function Reveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  amount = 0.16,
}) {
  const shouldReduceMotion = useReducedMotion()
  const offsets = {
    up: { y: 28, x: 0 },
    left: { x: -32, y: 0 },
    right: { x: 32, y: 0 },
    none: { x: 0, y: 0 },
  }

  return (
    <Motion.div
      className={className}
      initial={
        shouldReduceMotion
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, ...offsets[direction] }
      }
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : 0.65,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </Motion.div>
  )
}

export default Reveal
