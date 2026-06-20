export const motionEase = [0.22, 1, 0.36, 1]

export const revealViewport = {
  once: true,
  amount: 0.18,
  margin: '0px 0px 8% 0px',
}

export const springTransition = {
  type: 'spring',
  stiffness: 330,
  damping: 26,
  mass: 0.8,
}

export const gentleSpringTransition = {
  type: 'spring',
  stiffness: 250,
  damping: 28,
  mass: 0.9,
}

export function getRouteMotion(isCompact, shouldReduceMotion) {
  if (shouldReduceMotion) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
      transition: { duration: 0.01 },
    }
  }

  return {
    initial: { opacity: 0, y: isCompact ? 5 : 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: isCompact ? -2 : -5 },
    transition: {
      duration: isCompact ? 0.18 : 0.24,
      ease: motionEase,
    },
  }
}
