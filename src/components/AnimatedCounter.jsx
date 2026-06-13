import { animate, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

function AnimatedCounter({ value, suffix = '', className = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!isInView) return undefined

    const controls = animate(0, value, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    })

    return () => controls.stop()
  }, [isInView, value])

  return (
    <span ref={ref} className={className}>
      {displayValue}
      {suffix}
    </span>
  )
}

export default AnimatedCounter
