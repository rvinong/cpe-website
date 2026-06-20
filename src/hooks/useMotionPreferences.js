import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

const compactMotionQuery = '(max-width: 767px)'

function getInitialCompactMotion() {
  return typeof window !== 'undefined'
    ? window.matchMedia(compactMotionQuery).matches
    : false
}

export function useMotionPreferences() {
  const shouldReduceMotion = useReducedMotion()
  const [isCompactMotion, setIsCompactMotion] = useState(
    getInitialCompactMotion,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(compactMotionQuery)
    const handleChange = (event) => setIsCompactMotion(event.matches)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return {
    isCompactMotion,
    shouldReduceMotion: Boolean(shouldReduceMotion),
  }
}
