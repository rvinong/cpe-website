import {
  AnimatePresence,
  motion as Motion,
  useAnimationControls,
  useMotionValue,
  useSpring,
} from 'framer-motion'
import { Bot, Ellipsis, Minus, Power } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'
import useTheme from '../context/useTheme'
import { useMotionPreferences } from '../hooks/useMotionPreferences'
import {
  BYTE_PUBLISH_EVENT,
  BYTE_PUBLISH_STORAGE_KEY,
  getRecentBytePublication,
} from '../lib/byteAssistant'

const preferenceStorageKey = 'byte-assistant-preference'

const routeHints = [
  {
    match: (pathname) => pathname === '/',
    message: 'Tip: the latest updates are waiting just below the hero.',
  },
  {
    match: (pathname) => pathname.startsWith('/announcements'),
    message: 'Official notices and important updates live here.',
  },
  {
    match: (pathname) => pathname === '/events',
    message: 'Open an event card for its complete schedule and venue.',
  },
  {
    match: (pathname) => pathname === '/student-portal',
    message: 'Your resources and organization shortcuts are gathered here.',
  },
  {
    match: (pathname) => pathname === '/gallery',
    message: 'Select a photo to explore the full gallery view.',
  },
  {
    match: (pathname) => pathname === '/alumni',
    message: 'Meet the graduates who helped shape the CpE community.',
  },
  {
    match: (pathname) => pathname === '/about',
    message: 'This page tells the story behind the organization.',
  },
]

function getInitialPreference() {
  try {
    return localStorage.getItem(preferenceStorageKey) || 'visible'
  } catch {
    return 'visible'
  }
}

function getRouteHint(pathname) {
  return routeHints.find((hint) => hint.match(pathname))?.message || ''
}

function truncate(value, maximum = 42) {
  if (!value || value.length <= maximum) return value
  return `${value.slice(0, maximum - 3).trim()}...`
}

function ByteRobot({
  activeReaction,
  pupilX,
  pupilY,
  shouldReduceMotion,
  theme,
}) {
  const isWaving = ['click', 'hint', 'theme'].includes(activeReaction)
  const isCelebrating = activeReaction === 'publish'

  return (
    <Motion.span
      className="byte-assistant-float"
      animate={
        shouldReduceMotion
          ? { y: 0 }
          : { y: [0, -2.5, 0] }
      }
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg
        viewBox="0 0 88 78"
        className="byte-assistant-svg"
        aria-hidden="true"
      >
        <rect x="42" y="2" width="5" height="10" fill="#f97316" />
        <rect x="39" y="0" width="11" height="6" fill="#f97316" />

        <Motion.g
          animate={
            isWaving && !shouldReduceMotion
              ? { rotate: [0, -38, -12, -38, 0] }
              : { rotate: 0 }
          }
          transition={{ duration: 0.85, repeat: isWaving ? Infinity : 0 }}
          style={{ transformOrigin: '67px 47px' }}
        >
          <rect x="65" y="43" width="6" height="20" fill="#60a5fa" />
          <rect x="66" y="38" width="12" height="8" fill="#f97316" />
        </Motion.g>

        <rect x="17" y="43" width="6" height="20" fill="#60a5fa" />
        <rect x="10" y="58" width="12" height="7" fill="#f97316" />

        <path
          d="M22 11h44v5h6v29h-6v5H22v-5h-6V16h6v-5Z"
          fill={theme === 'dark' ? '#3b82f6' : '#60a5fa'}
        />
        <rect x="20" y="19" width="48" height="22" fill="#07152f" />
        <rect x="20" y="41" width="48" height="5" fill="#dbeafe" />

        <Motion.g
          animate={
            shouldReduceMotion
              ? { scaleY: 1 }
              : { scaleY: [1, 1, 0.12, 1, 1] }
          }
          transition={{
            duration: 4.6,
            repeat: Infinity,
            times: [0, 0.72, 0.76, 0.81, 1],
          }}
          style={{ transformOrigin: '44px 30px' }}
        >
          <rect x="28" y="24" width="10" height="11" fill="white" />
          <rect x="50" y="24" width="10" height="11" fill="white" />
          <Motion.g data-byte-pupils style={{ x: pupilX, y: pupilY }}>
            <rect x="33" y="28" width="4" height="6" fill="#07152f" />
            <rect x="55" y="28" width="4" height="6" fill="#07152f" />
          </Motion.g>
        </Motion.g>

        <rect x="38" y="38" width="12" height="2" fill="#f97316" />
        <path d="M27 49h34v4h5v14h-5v5H27v-5h-5V53h5v-4Z" fill="#f97316" />
        <rect x="34" y="55" width="20" height="8" fill="#fff7ed" />
        <rect x="30" y="70" width="10" height="6" fill="#60a5fa" />
        <rect x="48" y="70" width="10" height="6" fill="#60a5fa" />

        <AnimatePresence>
          {isCelebrating && !shouldReduceMotion && (
            <Motion.g
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 0], scale: [0.6, 1.15, 0.8] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, repeat: Infinity }}
              style={{ transformOrigin: '44px 35px' }}
            >
              <rect x="4" y="21" width="5" height="5" fill="#facc15" />
              <rect x="77" y="15" width="5" height="5" fill="#fb923c" />
              <rect x="7" y="42" width="4" height="4" fill="#60a5fa" />
              <rect x="78" y="47" width="4" height="4" fill="#a78bfa" />
            </Motion.g>
          )}
        </AnimatePresence>
      </svg>
    </Motion.span>
  )
}

function ByteAssistant() {
  const { pathname } = useLocation()
  const { theme } = useTheme()
  const { shouldReduceMotion } = useMotionPreferences()
  const robotRef = useRef(null)
  const reactionTimerRef = useRef(null)
  const pointerFrameRef = useRef(null)
  const previousThemeRef = useRef(theme)
  const seenHintsRef = useRef(new Set())
  const seenPublicationRef = useRef(null)
  const controls = useAnimationControls()
  const rawPupilX = useMotionValue(0)
  const rawPupilY = useMotionValue(0)
  const pupilX = useSpring(rawPupilX, { stiffness: 260, damping: 24 })
  const pupilY = useSpring(rawPupilY, { stiffness: 260, damping: 24 })
  const [preference, setPreference] = useState(getInitialPreference)
  const [reaction, setReaction] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const savePreference = (nextPreference) => {
    setPreference(nextPreference)
    setIsMenuOpen(false)
    try {
      localStorage.setItem(preferenceStorageKey, nextPreference)
    } catch {
      // The current session still honors the preference.
    }
  }

  const showReaction = useCallback((message, action = 'click', duration = 3200) => {
    window.clearTimeout(reactionTimerRef.current)
    setReaction({ id: Date.now(), message, action })

    if (!shouldReduceMotion) {
      const animation = action === 'publish'
        ? {
            y: [0, -10, 0, -6, 0],
            rotate: [0, -6, 6, -4, 0],
            transition: { duration: 0.9 },
          }
        : {
            y: [0, -7, 0],
            rotate: [0, -4, 4, 0],
            transition: { duration: 0.58 },
          }
      controls.start(animation)
    }

    reactionTimerRef.current = window.setTimeout(() => {
      setReaction(null)
      controls.start({ y: 0, rotate: 0 })
    }, duration)
  }, [controls, shouldReduceMotion])

  useEffect(() => () => {
    window.clearTimeout(reactionTimerRef.current)
    window.cancelAnimationFrame(pointerFrameRef.current)
  }, [])

  useEffect(() => {
    if (preference !== 'visible' || shouldReduceMotion) {
      rawPupilX.set(0)
      rawPupilY.set(0)
      return undefined
    }

    const precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!precisePointer.matches) return undefined

    const resetEyes = () => {
      rawPupilX.set(0)
      rawPupilY.set(0)
    }

    const handlePointerMove = (event) => {
      window.cancelAnimationFrame(pointerFrameRef.current)
      pointerFrameRef.current = window.requestAnimationFrame(() => {
        const bounds = robotRef.current?.getBoundingClientRect()
        if (!bounds) return

        const deltaX = event.clientX - (bounds.left + bounds.width / 2)
        const deltaY = event.clientY - (bounds.top + bounds.height * 0.36)
        const distance = Math.max(Math.hypot(deltaX, deltaY), 1)
        rawPupilX.set((deltaX / distance) * 2.7)
        rawPupilY.set((deltaY / distance) * 1.7)
      })
    }

    const handlePointerOut = (event) => {
      if (!event.relatedTarget) resetEyes()
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('mouseout', handlePointerOut)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('mouseout', handlePointerOut)
      resetEyes()
    }
  }, [preference, rawPupilX, rawPupilY, shouldReduceMotion])

  useEffect(() => {
    if (previousThemeRef.current === theme) return undefined
    previousThemeRef.current = theme
    if (preference !== 'visible') return undefined

    const timer = window.setTimeout(() => {
      showReaction(
        theme === 'dark' ? 'Night mode activated.' : 'Light mode activated.',
        'theme',
      )
    }, 0)
    return () => window.clearTimeout(timer)
  }, [preference, showReaction, theme])

  useEffect(() => {
    if (preference !== 'visible' || seenHintsRef.current.has(pathname)) {
      return undefined
    }

    const hint = getRouteHint(pathname)
    if (!hint) return undefined
    seenHintsRef.current.add(pathname)

    const timer = window.setTimeout(() => {
      showReaction(hint, 'hint', 4600)
    }, 6500)
    return () => window.clearTimeout(timer)
  }, [pathname, preference, showReaction])

  useEffect(() => {
    if (preference !== 'visible') return undefined

    const celebrate = (detail) => {
      if (!detail?.id || seenPublicationRef.current === detail.id) return
      seenPublicationRef.current = detail.id
      const label = detail.type === 'event' ? 'Event published' : 'New content published'
      showReaction(`${label}: ${truncate(detail.title)}`, 'publish', 4800)
    }

    const handlePublished = (event) => celebrate(event.detail)
    const handleStorage = (event) => {
      if (event.key !== BYTE_PUBLISH_STORAGE_KEY || !event.newValue) return
      try {
        celebrate(JSON.parse(event.newValue))
      } catch {
        // Ignore malformed values from other tabs.
      }
    }

    window.addEventListener(BYTE_PUBLISH_EVENT, handlePublished)
    window.addEventListener('storage', handleStorage)
    const recent = getRecentBytePublication()
    const timer = recent
      ? window.setTimeout(() => celebrate(recent), 900)
      : null

    return () => {
      window.removeEventListener(BYTE_PUBLISH_EVENT, handlePublished)
      window.removeEventListener('storage', handleStorage)
      window.clearTimeout(timer)
    }
  }, [preference, showReaction])

  useEffect(() => {
    if (!isMenuOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMenuOpen])

  if (preference === 'disabled') return null

  if (preference === 'minimized') {
    return (
      <Motion.button
        type="button"
        className="byte-assistant-minimized"
        onClick={() => savePreference('visible')}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        aria-label="Restore Byte Assistant"
        title="Restore Byte Assistant"
      >
        <Bot size={20} aria-hidden="true" />
      </Motion.button>
    )
  }

  const handleRobotClick = () => {
    const messages = ['Hi! I am Byte.', 'Beep! Systems ready.', 'Nice to see you.']
    showReaction(messages[Math.floor(Math.random() * messages.length)], 'click')
  }

  const disableAssistant = () => {
    const confirmed = window.confirm(
      'Disable Byte Assistant permanently on this device?',
    )
    if (confirmed) savePreference('disabled')
  }

  return (
    <aside className="byte-assistant-dock" aria-label="Byte Assistant">
      <AnimatePresence mode="wait">
        {reaction?.message && (
          <Motion.div
            key={reaction.id}
            className="byte-assistant-message"
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.96 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.2 }}
            role="status"
            aria-live="polite"
          >
            <span className="byte-assistant-message-label">Byte</span>
            <span>{reaction.message}</span>
          </Motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMenuOpen && (
          <Motion.div
            className="byte-assistant-menu"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.16 }}
          >
            <button type="button" onClick={() => savePreference('minimized')}>
              <Minus size={14} aria-hidden="true" />
              Minimize
            </button>
            <button type="button" onClick={disableAssistant}>
              <Power size={14} aria-hidden="true" />
              Disable
            </button>
          </Motion.div>
        )}
      </AnimatePresence>

      <div className="byte-assistant-character">
        <button
          type="button"
          className="byte-assistant-menu-toggle"
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-label="Byte Assistant options"
          aria-expanded={isMenuOpen}
          title="Byte Assistant options"
        >
          <Ellipsis size={15} aria-hidden="true" />
        </button>

        <Motion.button
          ref={robotRef}
          type="button"
          className="byte-assistant-robot"
          onClick={handleRobotClick}
          animate={controls}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
          aria-label="Byte Assistant. Activate a greeting."
          title="Say hello to Byte"
        >
          <ByteRobot
            activeReaction={reaction?.action}
            pupilX={pupilX}
            pupilY={pupilY}
            shouldReduceMotion={shouldReduceMotion}
            theme={theme}
          />
        </Motion.button>
      </div>
    </aside>
  )
}

export default ByteAssistant
