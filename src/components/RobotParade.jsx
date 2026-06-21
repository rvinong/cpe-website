import {
  AnimatePresence,
  motion as Motion,
  useInView,
} from 'framer-motion'
import { Pause, Play, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useMotionPreferences } from '../hooks/useMotionPreferences'

const robots = [
  {
    id: 'byte',
    name: 'Byte',
    kind: 'byte',
    primary: '#60a5fa',
    accent: '#f97316',
    home: 4,
    path: [4, 20, 20, 7, 7, 22, 22, 4],
    compactPath: [4, 18, 18, 6, 6, 20, 20, 4],
    duration: 23,
    delay: 0,
    emotes: ['HI', '!', '<3'],
  },
  {
    id: 'bolt',
    name: 'Bolt',
    kind: 'bolt',
    primary: '#fb923c',
    accent: '#facc15',
    home: 30,
    path: [30, 46, 46, 32, 32, 48, 48, 30],
    compactPath: [58, 68, 68, 58, 58, 70, 70, 58],
    duration: 26,
    delay: 1.4,
    emotes: ['GO', '!!', 'OK'],
  },
  {
    id: 'pixel',
    name: 'Pixel',
    kind: 'pixel',
    primary: '#22d3ee',
    accent: '#a78bfa',
    home: 55,
    path: [55, 69, 69, 57, 57, 72, 72, 55],
    compactPath: [38, 52, 52, 40, 40, 54, 54, 38],
    duration: 25,
    delay: 2.8,
    emotes: ['0101', ':)', '?'],
    visibilityClass: 'hidden sm:block',
  },
  {
    id: 'orbit',
    name: 'Orbit',
    kind: 'orbit',
    primary: '#a78bfa',
    accent: '#60a5fa',
    home: 79,
    path: [78, 86, 86, 79, 79, 88, 88, 78],
    compactPath: [78, 86, 86, 79, 79, 87, 87, 78],
    duration: 21,
    delay: 4.2,
    emotes: ['Zzz', '*', 'WOW'],
    visibilityClass: 'hidden lg:block',
  },
]

function getInitialPausePreference() {
  try {
    return localStorage.getItem('robot-parade-paused') === 'true'
  } catch {
    return false
  }
}

function RobotEyes({ active, kind }) {
  const isPixel = kind === 'pixel'

  return (
    <Motion.g
      animate={active ? { scaleY: [1, 1, 0.12, 1, 1] } : { scaleY: 1 }}
      transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.72, 0.76, 0.8, 1] }}
      style={{ transformOrigin: '40px 23px' }}
    >
      {isPixel ? (
        <>
          <rect x="29" y="20" width="6" height="6" rx="1" fill="white" />
          <rect x="45" y="20" width="6" height="6" rx="1" fill="white" />
        </>
      ) : (
        <>
          <circle cx="32" cy="23" r="3" fill="white" />
          <circle cx="48" cy="23" r="3" fill="white" />
        </>
      )}
    </Motion.g>
  )
}

function WalkingLeg({ x, direction, active, color }) {
  return (
    <Motion.g
      animate={active ? { rotate: [-12 * direction, 12 * direction, -12 * direction] } : { rotate: 0 }}
      transition={{ duration: 0.48, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: `${x}px 49px` }}
    >
      <line
        x1={x}
        y1="48"
        x2={x + direction * 2}
        y2="59"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line
        x1={x + direction * 2}
        y1="59"
        x2={x + direction * 7}
        y2="59"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </Motion.g>
  )
}

function ByteRobot({ design, active, reacting }) {
  return (
    <Motion.svg
      viewBox="0 0 80 64"
      className="robot-svg"
      animate={reacting ? { rotate: [0, -7, 7, -4, 0], y: [0, -3, 0] } : { y: active ? [0, -1.5, 0] : 0 }}
      transition={reacting ? { duration: 0.55 } : { duration: 0.7, repeat: Infinity }}
    >
      <line x1="40" y1="9" x2="40" y2="4" stroke={design.accent} strokeWidth="3" />
      <circle cx="40" cy="3" r="3" fill={design.accent} />
      <Motion.g
        animate={reacting ? { rotate: [0, -35, 18, -35, 0] } : { rotate: 0 }}
        transition={{ duration: 0.65 }}
        style={{ transformOrigin: '61px 39px' }}
      >
        <line x1="59" y1="37" x2="69" y2="30" stroke={design.primary} strokeWidth="5" strokeLinecap="round" />
        <circle cx="70" cy="29" r="3" fill={design.accent} />
      </Motion.g>
      <line x1="21" y1="37" x2="13" y2="44" stroke={design.primary} strokeWidth="5" strokeLinecap="round" />
      <rect x="18" y="9" width="44" height="31" rx="10" fill={design.primary} stroke="white" strokeWidth="2" />
      <rect x="24" y="15" width="32" height="17" rx="6" fill="#07152f" />
      <RobotEyes active={active} kind={design.kind} />
      <path d="M35 29h10" stroke={design.accent} strokeWidth="2" strokeLinecap="round" />
      <rect x="26" y="39" width="28" height="13" rx="6" fill={design.accent} stroke="white" strokeWidth="2" />
      <WalkingLeg x={33} direction={-1} active={active} color={design.primary} />
      <WalkingLeg x={47} direction={1} active={active} color={design.primary} />
    </Motion.svg>
  )
}

function BoltRobot({ design, active, reacting }) {
  return (
    <Motion.svg
      viewBox="0 0 80 64"
      className="robot-svg"
      animate={reacting ? { scale: [1, 1.08, 0.96, 1], y: [0, -4, 0] } : { y: active ? [0, -2, 0] : 0 }}
      transition={reacting ? { duration: 0.55 } : { duration: 0.62, repeat: Infinity }}
    >
      <path d="M39 2l-5 9h7l-2 8 8-11h-7l3-6Z" fill={design.accent} />
      <circle cx="17" cy="27" r="7" fill={design.accent} stroke="white" strokeWidth="2" />
      <circle cx="63" cy="27" r="7" fill={design.accent} stroke="white" strokeWidth="2" />
      <rect x="20" y="10" width="40" height="34" rx="14" fill={design.primary} stroke="white" strokeWidth="2" />
      <rect x="26" y="17" width="28" height="16" rx="8" fill="#07152f" />
      <RobotEyes active={active} kind={design.kind} />
      <path d="M35 30l5 3 5-3" fill="none" stroke={design.accent} strokeWidth="2" strokeLinecap="round" />
      <path d="M29 43h22l5 9H24l5-9Z" fill={design.accent} stroke="white" strokeWidth="2" />
      <WalkingLeg x={32} direction={-1} active={active} color={design.primary} />
      <WalkingLeg x={48} direction={1} active={active} color={design.primary} />
    </Motion.svg>
  )
}

function PixelRobot({ design, active, reacting }) {
  return (
    <Motion.svg
      viewBox="0 0 80 64"
      className="robot-svg"
      animate={reacting ? { rotate: [0, 4, -4, 4, 0], y: [0, -2, 0] } : { y: active ? [0, -1, 0] : 0 }}
      transition={reacting ? { duration: 0.6 } : { duration: 0.8, repeat: Infinity }}
    >
      <rect x="12" y="10" width="56" height="34" rx="9" fill={design.primary} stroke="white" strokeWidth="2" />
      <path d="M20 8V4m40 4V4" stroke={design.accent} strokeWidth="3" strokeLinecap="round" />
      <rect x="18" y="16" width="44" height="20" rx="5" fill="#07152f" />
      <RobotEyes active={active} kind={design.kind} />
      <path d="M34 31h4v2h8v-2h4" fill="none" stroke={design.accent} strokeWidth="2" />
      <rect x="25" y="43" width="30" height="9" rx="4.5" fill={design.accent} stroke="white" strokeWidth="2" />
      <Motion.circle
        cx="29"
        cy="56"
        r="6"
        fill={design.primary}
        stroke="white"
        strokeWidth="2"
        animate={active ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '29px 56px' }}
      />
      <Motion.circle
        cx="51"
        cy="56"
        r="6"
        fill={design.primary}
        stroke="white"
        strokeWidth="2"
        animate={active ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '51px 56px' }}
      />
    </Motion.svg>
  )
}

function OrbitRobot({ design, active, reacting }) {
  return (
    <Motion.svg
      viewBox="0 0 80 64"
      className="robot-svg"
      animate={reacting ? { y: [0, -7, 0], rotate: [0, 10, -10, 0] } : { y: active ? [0, -4, 0] : 0 }}
      transition={reacting ? { duration: 0.7 } : { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <line x1="40" y1="10" x2="40" y2="4" stroke={design.accent} strokeWidth="3" />
      <circle cx="40" cy="3" r="3" fill={design.accent} />
      <circle cx="40" cy="27" r="20" fill={design.primary} stroke="white" strokeWidth="2" />
      <rect x="24" y="17" width="32" height="18" rx="9" fill="#07152f" />
      <RobotEyes active={active} kind={design.kind} />
      <path d="M36 31h8" stroke={design.accent} strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="40" cy="50" rx="26" ry="8" fill={design.accent} stroke="white" strokeWidth="2" />
      <Motion.path
        d="M29 56h22l-4 6H33l-4-6Z"
        fill={design.primary}
        animate={active ? { opacity: [0.35, 0.9, 0.35] } : { opacity: 0.45 }}
        transition={{ duration: 0.9, repeat: Infinity }}
      />
    </Motion.svg>
  )
}

const robotComponents = {
  byte: ByteRobot,
  bolt: BoltRobot,
  pixel: PixelRobot,
  orbit: OrbitRobot,
}

function RobotCharacter({ design, active, compact }) {
  const [reaction, setReaction] = useState('')
  const [reactionIndex, setReactionIndex] = useState(0)
  const RobotFigure = robotComponents[design.kind]
  const path = compact ? design.compactPath : design.path
  const leftPath = path.map((position) => `${position}%`)
  const home = `${compact ? design.compactPath[0] : design.home}%`

  useEffect(() => {
    if (!reaction) return undefined
    const timeout = window.setTimeout(() => setReaction(''), 1500)
    return () => window.clearTimeout(timeout)
  }, [reaction])

  const triggerReaction = () => {
    const nextIndex = (reactionIndex + 1) % design.emotes.length
    setReactionIndex(nextIndex)
    setReaction(design.emotes[nextIndex])
  }

  return (
    <Motion.button
      type="button"
      onClick={triggerReaction}
      className={`robot-character absolute bottom-0 z-10 ${design.visibilityClass || ''}`}
      style={{ left: home }}
      animate={active ? { left: leftPath } : { left: home }}
      transition={
        active
          ? {
              duration: compact ? design.duration * 0.82 : design.duration,
              delay: design.delay,
              repeat: Infinity,
              ease: 'linear',
            }
          : { duration: 0.3 }
      }
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.94 }}
      aria-label={`${design.name} robot. Activate an emote.`}
      title={`${design.name}: click for an emote`}
    >
      <AnimatePresence>
        {reaction && (
          <Motion.span
            key={reaction}
            initial={{ opacity: 0, y: 5, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.86 }}
            className="robot-emote"
            aria-hidden="true"
          >
            {reaction}
          </Motion.span>
        )}
      </AnimatePresence>

      {!reaction && active && (
        <Motion.span
          className="robot-emote"
          animate={{ opacity: [0, 0, 1, 1, 0, 0], y: [4, 4, 0, 0, -3, -3] }}
          transition={{
            duration: 9,
            delay: design.delay + 2,
            repeat: Infinity,
            times: [0, 0.58, 0.64, 0.78, 0.84, 1],
          }}
          aria-hidden="true"
        >
          {design.emotes[0]}
        </Motion.span>
      )}

      <Motion.span
        className="block"
        animate={
          active
            ? { scaleX: [1, 1, -1, -1, 1, 1, -1, -1, 1] }
            : { scaleX: 1 }
        }
        transition={
          active
            ? {
                duration: compact ? design.duration * 0.82 : design.duration,
                delay: design.delay,
                repeat: Infinity,
                ease: 'linear',
                times: [0, 0.2, 0.205, 0.44, 0.445, 0.66, 0.665, 0.9, 1],
              }
            : { duration: 0.2 }
        }
      >
        <RobotFigure design={design} active={active} reacting={Boolean(reaction)} />
      </Motion.span>
      <span className="robot-shadow" aria-hidden="true" />
    </Motion.button>
  )
}

function RobotParade() {
  const stageRef = useRef(null)
  const isInView = useInView(stageRef, { margin: '120px 0px', amount: 0.2 })
  const { isCompactMotion, shouldReduceMotion } = useMotionPreferences()
  const [isPaused, setIsPaused] = useState(getInitialPausePreference)
  const isActive = isInView && !isPaused && !shouldReduceMotion

  useEffect(() => {
    try {
      localStorage.setItem('robot-parade-paused', String(isPaused))
    } catch {
      // The parade still works when storage is unavailable.
    }
  }, [isPaused])

  return (
    <div ref={stageRef} className="robot-parade" aria-label="Interactive robot parade">
      <Motion.span
        className="robot-connection-spark hidden md:grid"
        animate={
          isActive
            ? { opacity: [0, 0, 1, 0], scale: [0.6, 0.6, 1.15, 0.7], rotate: [0, 0, 18, 30] }
            : { opacity: 0 }
        }
        transition={{ duration: 12, delay: 5, repeat: Infinity, times: [0, 0.7, 0.76, 0.84] }}
        aria-hidden="true"
      >
        <Sparkles size={14} />
      </Motion.span>

      {robots.map((robot) => (
        <RobotCharacter
          key={robot.id}
          design={robot}
          active={isActive}
          compact={isCompactMotion}
        />
      ))}

      <button
        type="button"
        onClick={() => setIsPaused((current) => !current)}
        className="robot-pause-control"
        aria-label={isPaused ? 'Play robot animations' : 'Pause robot animations'}
        title={isPaused ? 'Play robot animations' : 'Pause robot animations'}
      >
        {isPaused ? <Play size={14} /> : <Pause size={14} />}
      </button>
    </div>
  )
}

export default RobotParade
