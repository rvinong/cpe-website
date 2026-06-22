import {
  AnimatePresence,
  motion as Motion,
  useInView,
} from 'framer-motion'
import { Sparkles } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useMotionPreferences } from '../hooks/useMotionPreferences'

const actionDetails = {
  wave: { duration: 1.9, emote: 'HI' },
  look: { duration: 1.7, emote: '?' },
  sleep: { duration: 3.8, emote: 'Zzz' },
  dance: { duration: 2.4, emote: 'PLAY' },
  charge: { duration: 2.8, emote: 'CHG' },
  scan: { duration: 2.5, emote: 'SCAN' },
  calculate: { duration: 2.7, emote: '0101' },
  hover: { duration: 2.2, emote: '*' },
}

const robots = [
  {
    id: 'byte',
    name: 'Byte',
    kind: 'byte',
    primary: '#60a5fa',
    accent: '#f97316',
    home: 5,
    compactHome: 5,
    route: [76, 12, 62, 7, 84, 28],
    compactRoute: [80, 8, 70, 16, 82, 31],
    speed: 8.4,
    lane: 1,
    idles: ['wave', 'look', 'sleep'],
    clickEmotes: ['HI', '<3', 'BEEP'],
    socialEmote: 'HI',
  },
  {
    id: 'bolt',
    name: 'Bolt',
    kind: 'bolt',
    primary: '#fb923c',
    accent: '#facc15',
    home: 31,
    compactHome: 58,
    route: [9, 81, 23, 69, 5, 49],
    compactRoute: [8, 79, 19, 82, 35, 5],
    speed: 9.2,
    lane: 0,
    idles: ['dance', 'charge', 'wave'],
    clickEmotes: ['GO!', 'WOW', 'OK'],
    socialEmote: '!',
  },
  {
    id: 'pixel',
    name: 'Pixel',
    kind: 'pixel',
    primary: '#22d3ee',
    accent: '#a78bfa',
    home: 56,
    route: [82, 18, 72, 6, 49, 87],
    compactRoute: [78, 18, 70, 7, 42, 81],
    speed: 7.8,
    lane: 2,
    idles: ['scan', 'calculate', 'charge'],
    clickEmotes: ['0101', ':)', 'READY'],
    socialEmote: 'PING',
    visibilityClass: 'hidden sm:block',
  },
  {
    id: 'orbit',
    name: 'Orbit',
    kind: 'orbit',
    primary: '#a78bfa',
    accent: '#60a5fa',
    home: 80,
    route: [42, 7, 74, 21, 87, 53],
    compactRoute: [64, 8, 69, 22, 45, 6],
    speed: 7.2,
    lane: 3,
    idles: ['hover', 'scan', 'sleep'],
    clickEmotes: ['WOW', '*', 'HELLO'],
    socialEmote: '...?',
    visibilityClass: 'hidden lg:block',
  },
]

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum)
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function useRobotBrain(design, active, compact) {
  const maximumPosition = compact ? 84 : 88
  const initialPosition = compact
    ? (design.compactHome ?? design.home)
    : design.home
  const timerRef = useRef(null)
  const [brain, setBrain] = useState(() => ({
    mode: 'idle',
    position: initialPosition,
    facing: 1,
    lane: design.lane,
    duration: 0,
    routeIndex: 0,
  }))

  const beginNextAction = useCallback(() => {
    setBrain((current) => {
      if (Math.random() > 0.66) {
        const mode = pick(design.idles)
        return {
          ...current,
          mode,
          duration: actionDetails[mode].duration,
        }
      }

      const route = compact && design.compactRoute
        ? design.compactRoute
        : design.route
      const routeIndex = current.routeIndex % route.length
      let destination = clamp(
        route[routeIndex] + randomBetween(-2.25, 2.25),
        3,
        maximumPosition,
      )

      if (Math.abs(destination - current.position) < 8) {
        destination = clamp(
          route[(routeIndex + 1) % route.length],
          3,
          maximumPosition,
        )
      }

      const distance = Math.abs(destination - current.position)
      const speed = compact ? design.speed * 0.92 : design.speed

      return {
        ...current,
        mode: 'moving',
        position: destination,
        facing: destination >= current.position ? 1 : -1,
        lane: Math.floor(randomBetween(0, 3.99)),
        duration: clamp(distance / speed, 2.4, 8.5),
        routeIndex: routeIndex + 1,
      }
    })
  }, [compact, design, maximumPosition])

  const finishMovement = useCallback(() => {
    setBrain((current) => (
      current.mode === 'moving'
        ? { ...current, mode: 'idle', duration: 0 }
        : current
    ))
  }, [])

  useEffect(() => {
    window.clearTimeout(timerRef.current)

    if (!active) {
      timerRef.current = window.setTimeout(() => {
        setBrain((current) => (
          current.mode === 'idle'
            ? current
            : { ...current, mode: 'idle', duration: 0 }
        ))
      }, 0)
      return () => window.clearTimeout(timerRef.current)
    }

    if (brain.mode === 'moving') return undefined

    const isResting = brain.mode === 'idle'
    const wait = isResting
      ? randomBetween(650, 1750)
      : brain.duration * 1000

    timerRef.current = window.setTimeout(() => {
      if (isResting) {
        beginNextAction()
      } else {
        setBrain((current) => ({
          ...current,
          mode: 'idle',
          duration: 0,
        }))
      }
    }, wait)

    return () => window.clearTimeout(timerRef.current)
  }, [active, beginNextAction, brain.duration, brain.mode])

  return { brain, finishMovement }
}

function RobotEyes({ active, accent, mode }) {
  if (mode === 'sleep') {
    return (
      <g>
        <rect x="28" y="23" width="8" height="2" fill="white" />
        <rect x="44" y="23" width="8" height="2" fill="white" />
      </g>
    )
  }

  return (
    <Motion.g
      animate={
        active && mode === 'look'
          ? { x: [0, 2, -2, 0] }
          : { x: 0 }
      }
      transition={{ duration: 1.55, repeat: mode === 'look' ? Infinity : 0 }}
    >
      <Motion.g
        animate={active ? { scaleY: [1, 1, 0.12, 1, 1] } : { scaleY: 1 }}
        transition={{
          duration: 4.4,
          repeat: Infinity,
          times: [0, 0.7, 0.74, 0.79, 1],
        }}
        style={{ transformOrigin: '40px 23px' }}
      >
        <rect x="28" y="19" width="8" height="8" fill="white" />
        <rect x="44" y="19" width="8" height="8" fill="white" />
        <rect x="32" y="22" width="3" height="4" fill="#07152f" />
        <rect x="48" y="22" width="3" height="4" fill="#07152f" />
        {mode === 'scan' && (
          <rect x="44" y="19" width="8" height="8" fill={accent} />
        )}
      </Motion.g>
    </Motion.g>
  )
}

function WalkingLeg({ x, phase, moving, color }) {
  const stride = phase === 0 ? [-15, 15, -15] : [15, -15, 15]

  return (
    <Motion.g
      data-locomotion="leg"
      animate={moving ? { rotate: stride } : { rotate: 0 }}
      transition={{ duration: 0.42, repeat: Infinity, ease: 'linear' }}
      style={{ transformOrigin: `${x}px 48px` }}
    >
      <rect x={x - 2} y="47" width="5" height="12" fill={color} />
      <rect
        x={phase === 0 ? x - 5 : x - 1}
        y="57"
        width="9"
        height="4"
        fill="white"
      />
    </Motion.g>
  )
}

function getBodyAnimation(mode, active, reacting) {
  const rest = { x: 0, y: 0, rotate: 0, scale: 1, scaleY: 1 }

  if (!active) return rest
  if (reacting) {
    return {
      x: 0,
      y: [0, -5, 0],
      rotate: [0, -7, 7, -3, 0],
      scale: [1, 1.05, 1],
      scaleY: 1,
    }
  }

  const animations = {
    idle: { ...rest, y: [0, -0.6, 0], scaleY: [1, 0.99, 1] },
    moving: { ...rest, y: [0, -1.5, 0] },
    wave: { ...rest, y: [0, -1, 0] },
    look: { ...rest, rotate: [0, -2, 2, 0] },
    sleep: { ...rest, y: [1, 2, 1], scaleY: [1, 0.96, 1] },
    dance: {
      ...rest,
      y: [0, -4, 0, -2, 0],
      rotate: [0, -5, 5, -5, 0],
    },
    charge: { ...rest, scale: [1, 1.035, 1] },
    scan: { ...rest, x: [0, 1, -1, 0] },
    calculate: { ...rest, rotate: [0, -1.5, 1.5, 0] },
    hover: { ...rest, y: [0, -4, 0] },
  }

  return animations[mode] || rest
}

function getBodyTransition(mode, reacting) {
  if (reacting) return { duration: 0.68, ease: 'easeOut' }

  const durations = {
    idle: 3.6,
    moving: 0.44,
    wave: 1.1,
    look: 1.6,
    sleep: 2.8,
    dance: 1.05,
    charge: 0.8,
    scan: 1.2,
    calculate: 1.3,
    hover: 1.8,
  }

  return {
    duration: durations[mode] || 1.4,
    repeat: Infinity,
    ease: mode === 'moving' ? 'linear' : 'easeInOut',
  }
}

function RobotShell({ children, mode, active, reacting }) {
  return (
    <Motion.svg
      viewBox="0 0 80 64"
      className="robot-svg"
      animate={getBodyAnimation(mode, active, reacting)}
      transition={getBodyTransition(mode, reacting)}
      aria-hidden="true"
    >
      {children}
    </Motion.svg>
  )
}

function ByteRobot({ design, active, mode, moving, reacting }) {
  const waving = mode === 'wave' || reacting

  return (
    <RobotShell mode={mode} active={active} reacting={reacting}>
      <rect x="38" y="1" width="4" height="8" fill={design.accent} />
      <rect x="36" y="0" width="8" height="5" fill={design.accent} />

      <Motion.g
        animate={
          waving
            ? { rotate: [0, -42, -15, -42, 0] }
            : moving
              ? { rotate: [-9, 9, -9] }
              : { rotate: 0 }
        }
        transition={{ duration: waving ? 0.9 : 0.42, repeat: waving || moving ? Infinity : 0 }}
        style={{ transformOrigin: '59px 37px' }}
      >
        <rect x="58" y="35" width="5" height="14" fill={design.primary} />
        <rect x="59" y="31" width="9" height="7" fill={design.accent} />
      </Motion.g>

      <Motion.g
        animate={moving ? { rotate: [9, -9, 9] } : { rotate: 0 }}
        transition={{ duration: 0.42, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '21px 37px' }}
      >
        <rect x="17" y="35" width="5" height="14" fill={design.primary} />
        <rect x="12" y="45" width="9" height="6" fill={design.accent} />
      </Motion.g>

      <path d="M22 10h36v4h5v22h-5v5H22v-5h-5V14h5v-4Z" fill={design.primary} />
      <rect x="20" y="17" width="40" height="17" fill="#07152f" />
      <rect x="20" y="34" width="40" height="4" fill="#dbeafe" />
      <RobotEyes active={active} accent={design.accent} mode={mode} />
      <rect x="36" y="30" width="8" height="2" fill={design.accent} />

      <path d="M27 39h26v3h4v9h-4v4H27v-4h-4v-9h4v-3Z" fill={design.accent} />
      <rect x="34" y="44" width="12" height="5" fill="#fff7ed" />
      <WalkingLeg x={33} phase={0} moving={moving} color={design.primary} />
      <WalkingLeg x={47} phase={1} moving={moving} color={design.primary} />
    </RobotShell>
  )
}

function BoltRobot({ design, active, mode, moving, reacting }) {
  const waving = mode === 'wave' || reacting

  return (
    <RobotShell mode={mode} active={active} reacting={reacting}>
      <Motion.path
        d="M39 0h7l-4 8h6l-10 11 3-8h-6l4-11Z"
        fill={design.accent}
        animate={mode === 'charge' ? { opacity: [0.35, 1, 0.35] } : { opacity: 1 }}
        transition={{ duration: 0.42, repeat: Infinity }}
      />

      <Motion.g
        animate={
          waving
            ? { rotate: [0, -38, -12, -38, 0] }
            : moving
              ? { rotate: [-8, 8, -8] }
              : { rotate: 0 }
        }
        transition={{ duration: waving ? 0.88 : 0.42, repeat: waving || moving ? Infinity : 0 }}
        style={{ transformOrigin: '61px 38px' }}
      >
        <rect x="59" y="35" width="6" height="15" fill={design.primary} />
        <rect x="61" y="31" width="9" height="7" fill={design.accent} />
      </Motion.g>

      <rect x="8" y="22" width="12" height="16" fill={design.accent} />
      <rect x="60" y="22" width="12" height="16" fill={design.accent} />
      <path d="M25 9h30v4h6v28h-6v4H25v-4h-6V13h6V9Z" fill={design.primary} />
      <rect x="24" y="16" width="32" height="19" fill="#07152f" />
      <RobotEyes active={active} accent={design.accent} mode={mode} />
      <path d="M35 30h4v3h6v-3h4" fill="none" stroke={design.accent} strokeWidth="2" />

      <path d="M28 43h24l6 9H22l6-9Z" fill={design.accent} />
      <rect x="35" y="45" width="10" height="4" fill="#07152f" />
      <WalkingLeg x={32} phase={0} moving={moving} color={design.primary} />
      <WalkingLeg x={48} phase={1} moving={moving} color={design.primary} />
    </RobotShell>
  )
}

function PixelWheel({ x, moving, primary, accent }) {
  return (
    <Motion.g
      data-locomotion="wheel"
      animate={moving ? { rotate: 360 } : { rotate: 0 }}
      transition={{ duration: 0.58, repeat: Infinity, ease: 'linear' }}
      style={{ transformOrigin: `${x + 6}px 56px` }}
    >
      <rect x={x} y="50" width="12" height="12" fill="#07152f" />
      <rect x={x + 2} y="52" width="8" height="8" fill={primary} />
      <rect x={x + 5} y="52" width="2" height="8" fill={accent} />
      <rect x={x + 2} y="55" width="8" height="2" fill={accent} />
    </Motion.g>
  )
}

function PixelRobot({ design, active, mode, moving, reacting }) {
  return (
    <RobotShell mode={mode} active={active} reacting={reacting}>
      <rect x="17" y="5" width="5" height="7" fill={design.accent} />
      <rect x="58" y="5" width="5" height="7" fill={design.accent} />
      <path d="M15 9h50v4h5v27h-5v5H15v-5h-5V13h5V9Z" fill={design.primary} />
      <rect x="16" y="16" width="48" height="20" fill="#07152f" />
      <RobotEyes active={active} accent={design.accent} mode={mode} />
      <path d="M34 31h4v2h8v-2h4" fill="none" stroke={design.accent} strokeWidth="2" />

      <AnimatePresence>
        {mode === 'scan' && active && (
          <Motion.g
            data-locomotion="thruster"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.75, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, repeat: Infinity }}
          >
            <path d="M64 19h8v3h5v4h-5v3h-8V19Z" fill={design.accent} />
            <rect x="68" y="23" width="10" height="2" fill="#c4b5fd" />
          </Motion.g>
        )}
      </AnimatePresence>

      <rect x="23" y="42" width="34" height="11" fill={design.accent} />
      <rect x="29" y="45" width="5" height="4" fill="#07152f" />
      <rect x="38" y="45" width="5" height="4" fill="#07152f" />
      <rect x="47" y="45" width="5" height="4" fill="#07152f" />
      <PixelWheel x={21} moving={moving} primary={design.primary} accent={design.accent} />
      <PixelWheel x={47} moving={moving} primary={design.primary} accent={design.accent} />
    </RobotShell>
  )
}

function OrbitRobot({ design, active, mode, moving, reacting }) {
  return (
    <RobotShell mode={mode} active={active} reacting={reacting}>
      <rect x="38" y="1" width="4" height="8" fill={design.accent} />
      <rect x="36" y="0" width="8" height="5" fill={design.accent} />
      <path d="M30 7h20v4h7v6h4v20h-4v7h-7v4H30v-4h-7v-7h-4V17h4v-6h7V7Z" fill={design.primary} />
      <rect x="23" y="17" width="34" height="19" fill="#07152f" />
      <RobotEyes active={active} accent={design.accent} mode={mode} />
      <rect x="36" y="31" width="8" height="2" fill={design.accent} />

      <rect x="11" y="28" width="10" height="12" fill={design.accent} />
      <rect x="59" y="28" width="10" height="12" fill={design.accent} />
      <path d="M18 43h44v4h7v8h-7v4H18v-4h-7v-8h7v-4Z" fill={design.accent} />
      <rect x="26" y="47" width="28" height="7" fill="#dbeafe" />

      <AnimatePresence>
        {moving && (
          <Motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Motion.path
              d="M27 57h10l-3 7h-5l-2-7Z"
              fill={design.primary}
              animate={{ scaleY: [0.55, 1, 0.55] }}
              transition={{ duration: 0.38, repeat: Infinity }}
              style={{ transformOrigin: '32px 57px' }}
            />
            <Motion.path
              d="M43 57h10l-2 7h-5l-3-7Z"
              fill={design.primary}
              animate={{ scaleY: [1, 0.55, 1] }}
              transition={{ duration: 0.38, repeat: Infinity }}
              style={{ transformOrigin: '48px 57px' }}
            />
          </Motion.g>
        )}
      </AnimatePresence>
    </RobotShell>
  )
}

const robotComponents = {
  byte: ByteRobot,
  bolt: BoltRobot,
  pixel: PixelRobot,
  orbit: OrbitRobot,
}

function RobotCharacter({
  design,
  active,
  compact,
  encounter,
  onInteract,
}) {
  const { brain, finishMovement } = useRobotBrain(design, active, compact)
  const [clickReaction, setClickReaction] = useState('')
  const [socialReaction, setSocialReaction] = useState('')
  const reactionIndexRef = useRef(0)
  const RobotFigure = robotComponents[design.kind]
  const moving = active && brain.mode === 'moving'
  const actionEmote = active && actionDetails[brain.mode]
    ? actionDetails[brain.mode].emote
    : ''
  const reaction = clickReaction || socialReaction
  const emote = reaction || actionEmote
  const renderedPosition = clamp(brain.position, 3, compact ? 84 : 88)

  useEffect(() => {
    if (!clickReaction) return undefined
    const timeout = window.setTimeout(() => setClickReaction(''), 1450)
    return () => window.clearTimeout(timeout)
  }, [clickReaction])

  useEffect(() => {
    if (!active || !encounter.source || encounter.source === design.id) {
      return undefined
    }

    let hideTimer
    const showTimer = window.setTimeout(() => {
      setSocialReaction(design.socialEmote)
      hideTimer = window.setTimeout(() => setSocialReaction(''), 1050)
    }, randomBetween(180, 560))

    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [active, design.id, design.socialEmote, encounter.source, encounter.token])

  const triggerReaction = () => {
    const index = reactionIndexRef.current % design.clickEmotes.length
    reactionIndexRef.current += 1
    setClickReaction(design.clickEmotes[index])
    onInteract(design.id)
  }

  return (
    <Motion.button
      type="button"
      onClick={triggerReaction}
      className={`robot-character absolute ${design.visibilityClass || ''}`}
      style={{
        left: `${renderedPosition}%`,
        bottom: `${brain.lane * 3}px`,
        zIndex: 12 + brain.lane,
      }}
      animate={{
        left: `${renderedPosition}%`,
        bottom: `${brain.lane * 3}px`,
      }}
      transition={{
        left: {
          duration: moving ? brain.duration : 0.18,
          ease: 'linear',
        },
        bottom: { duration: 0.32, ease: 'easeOut' },
      }}
      onAnimationComplete={() => {
        if (moving) finishMovement()
      }}
      whileHover={active ? { y: -3 } : undefined}
      whileTap={{ scale: 0.94 }}
      data-mode={brain.mode}
      data-moving={moving ? 'true' : 'false'}
      data-robot={design.id}
      aria-label={`${design.name} robot. ${brain.mode}. Activate an emote.`}
      title={`${design.name}: click for a reaction`}
    >
      <AnimatePresence mode="wait">
        {emote && (
          <Motion.span
            key={`${brain.mode}-${emote}`}
            initial={{ opacity: 0, y: 5, scale: 0.82 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.88 }}
            transition={{ duration: 0.18 }}
            className="robot-emote"
            aria-hidden="true"
          >
            {emote}
          </Motion.span>
        )}
      </AnimatePresence>

      <Motion.span
        className="robot-figure"
        animate={{ scaleX: brain.facing }}
        transition={{ duration: 0.12 }}
      >
        <RobotFigure
          design={design}
          active={active}
          mode={brain.mode}
          moving={moving}
          reacting={Boolean(reaction)}
        />
      </Motion.span>
    </Motion.button>
  )
}

function PixelPals() {
  const stageRef = useRef(null)
  const isInView = useInView(stageRef, { margin: '120px 0px', amount: 0.2 })
  const { isCompactMotion, shouldReduceMotion } = useMotionPreferences()
  const [encounter, setEncounter] = useState({ source: null, token: 0 })
  const isActive = isInView && !shouldReduceMotion

  useEffect(() => {
    if (!encounter.source) return undefined
    const timeout = window.setTimeout(() => {
      setEncounter((current) => ({ ...current, source: null }))
    }, 1500)
    return () => window.clearTimeout(timeout)
  }, [encounter.source, encounter.token])

  const handleInteract = (source) => {
    setEncounter((current) => ({
      source,
      token: current.token + 1,
    }))
  }

  return (
    <div
      ref={stageRef}
      className="robot-parade"
      aria-label="Interactive Pixel Pals robot playground"
    >
      <AnimatePresence>
        {encounter.source && (
          <Motion.span
            key={encounter.token}
            className="robot-connection-spark hidden md:grid"
            initial={{ opacity: 0, scale: 0.55, rotate: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.55, 1.18, 0.72], rotate: [0, 15, 28] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }}
            aria-hidden="true"
          >
            <Sparkles size={14} />
          </Motion.span>
        )}
      </AnimatePresence>

      {robots.map((robot) => (
        <RobotCharacter
          key={robot.id}
          design={robot}
          active={isActive}
          compact={isCompactMotion}
          encounter={encounter}
          onInteract={handleInteract}
        />
      ))}

    </div>
  )
}

export default PixelPals
