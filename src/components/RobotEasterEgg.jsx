import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion as Motion,
  useInView,
} from 'framer-motion'
import { useMotionPreferences } from '../hooks/useMotionPreferences'

const robotPalettes = {
  scout: {
    primary: '#2563eb',
    secondary: '#7dd3fc',
    accent: '#f97316',
    screen: '#07152f',
    light: '#e0f2fe',
  },
  circuit: {
    primary: '#0f766e',
    secondary: '#2dd4bf',
    accent: '#f59e0b',
    screen: '#052e2b',
    light: '#ccfbf1',
  },
  orbit: {
    primary: '#7c3aed',
    secondary: '#60a5fa',
    accent: '#fb7185',
    booster: '#f97316',
    boosterCore: '#fef08a',
    screen: '#11103b',
    light: '#ede9fe',
  },
  archive: {
    primary: '#ea580c',
    secondary: '#fbbf24',
    accent: '#2563eb',
    screen: '#172554',
    light: '#ffedd5',
  },
}

function ScoutRobot({ colors }) {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <rect x="45" y="3" width="6" height="10" fill={colors.accent} />
      <rect x="40" y="1" width="16" height="6" fill={colors.accent} />
      <rect x="13" y="31" width="11" height="25" fill={colors.secondary} />
      <rect x="8" y="37" width="7" height="14" fill={colors.primary} />
      <rect x="72" y="31" width="11" height="25" fill={colors.secondary} />
      <rect x="81" y="37" width="7" height="14" fill={colors.primary} />

      <path
        d="M25 14h46v5h7v37h-7v7H25v-7h-7V19h7v-5Z"
        fill="#07152f"
      />
      <path
        d="M28 17h40v4h6v31h-6v6H28v-6h-6V21h6v-4Z"
        fill={colors.primary}
      />
      <rect x="28" y="26" width="40" height="21" fill={colors.screen} />
      <rect x="33" y="30" width="10" height="9" fill={colors.light} />
      <rect x="53" y="30" width="10" height="9" fill={colors.light} />
      <rect x="36" y="33" width="4" height="6" fill="#07152f" />
      <rect x="56" y="33" width="4" height="6" fill="#07152f" />
      <rect x="40" y="42" width="16" height="2" fill={colors.accent} />

      <path d="M28 58h40v6H28v-6Z" fill={colors.secondary} />
      <rect x="34" y="62" width="28" height="18" fill={colors.primary} />
      <rect x="40" y="67" width="16" height="7" fill={colors.accent} />
      <rect x="44" y="68" width="8" height="4" fill={colors.light} />
      <g className="robot-feet">
        <g className="robot-foot robot-foot-left">
          <rect x="30" y="80" width="13" height="7" fill={colors.secondary} />
          <rect x="27" y="87" width="18" height="4" fill="#07152f" />
        </g>
        <g className="robot-foot robot-foot-right">
          <rect x="53" y="80" width="13" height="7" fill={colors.secondary} />
          <rect x="51" y="87" width="18" height="4" fill="#07152f" />
        </g>
      </g>
    </svg>
  )
}

function CircuitRobot({ colors }) {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <rect x="44" y="2" width="8" height="12" fill={colors.accent} />
      <rect x="38" y="6" width="20" height="5" fill={colors.secondary} />
      <rect x="11" y="29" width="9" height="22" fill={colors.accent} />
      <rect x="76" y="29" width="9" height="22" fill={colors.accent} />

      <path d="M22 16h52v5h5v38h-5v6H22v-6h-5V21h5v-5Z" fill="#07152f" />
      <path d="M25 19h46v4h5v32h-5v6H25v-6h-5V23h5v-4Z" fill={colors.primary} />
      <rect x="27" y="27" width="42" height="19" fill={colors.screen} />
      <path d="M31 32h9v5h7v5" fill="none" stroke={colors.secondary} strokeWidth="2" />
      <path d="M65 30h-8v6h-7v6" fill="none" stroke={colors.accent} strokeWidth="2" />
      <rect x="34" y="31" width="4" height="4" fill={colors.light} />
      <rect x="58" y="37" width="4" height="4" fill={colors.light} />
      <rect x="42" y="51" width="12" height="2" fill={colors.accent} />

      <path d="M28 61h40v7H28v-7Z" fill={colors.secondary} />
      <g className="robot-feet">
        <g className="robot-foot robot-foot-left">
          <rect x="34" y="68" width="10" height="15" fill={colors.primary} />
          <rect x="30" y="81" width="18" height="7" fill={colors.accent} />
          <rect x="27" y="88" width="24" height="4" fill="#07152f" />
        </g>
        <g className="robot-foot robot-foot-right">
          <rect x="52" y="68" width="10" height="15" fill={colors.primary} />
          <rect x="48" y="81" width="18" height="7" fill={colors.accent} />
          <rect x="45" y="88" width="24" height="4" fill="#07152f" />
        </g>
      </g>
    </svg>
  )
}

function OrbitRobot({ colors }) {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <path
        d="M12 42c0-22 16-35 36-35s36 13 36 35-16 35-36 35S12 64 12 42Z"
        fill="none"
        stroke={colors.accent}
        strokeWidth="3"
        strokeDasharray="7 5"
      />
      <rect x="7" y="36" width="10" height="12" fill={colors.secondary} />
      <rect x="79" y="36" width="10" height="12" fill={colors.secondary} />
      <rect x="42" y="2" width="12" height="8" fill={colors.accent} />
      <rect x="46" y="8" width="4" height="7" fill={colors.secondary} />

      <circle cx="48" cy="42" r="29" fill="#07152f" />
      <circle cx="48" cy="42" r="25" fill={colors.primary} />
      <rect x="25" y="32" width="46" height="20" fill={colors.screen} />
      <rect x="31" y="37" width="11" height="8" fill={colors.light} />
      <rect x="54" y="37" width="11" height="8" fill={colors.light} />
      <rect x="35" y="40" width="4" height="5" fill="#07152f" />
      <rect x="58" y="40" width="4" height="5" fill="#07152f" />
      <rect x="41" y="48" width="14" height="2" fill={colors.accent} />
      <path d="M31 56h34v8H31v-8Z" fill={colors.secondary} />
      <rect x="37" y="64" width="22" height="8" fill={colors.accent} />
      <g className="robot-boosters">
        <g className="robot-booster robot-booster-left">
          <rect x="30" y="71" width="13" height="6" fill={colors.secondary} />
          <rect x="32" y="77" width="9" height="7" fill="#07152f" />
          <path
            className="robot-booster-flame robot-booster-flame-left"
            d="M32 84h9v5h-2v4h-5v-4h-2v-5Z"
            fill={colors.booster}
          />
          <rect
            className="robot-booster-core robot-booster-core-left"
            x="35"
            y="84"
            width="3"
            height="6"
            fill={colors.boosterCore}
          />
        </g>
        <g className="robot-booster robot-booster-right">
          <rect x="53" y="71" width="13" height="6" fill={colors.secondary} />
          <rect x="55" y="77" width="9" height="7" fill="#07152f" />
          <path
            className="robot-booster-flame robot-booster-flame-right"
            d="M55 84h9v5h-2v4h-5v-4h-2v-5Z"
            fill={colors.booster}
          />
          <rect
            className="robot-booster-core robot-booster-core-right"
            x="58"
            y="84"
            width="3"
            height="6"
            fill={colors.boosterCore}
          />
        </g>
      </g>
    </svg>
  )
}

function ArchiveRobot({ colors }) {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <rect x="45" y="3" width="6" height="11" fill={colors.accent} />
      <rect x="39" y="1" width="18" height="6" fill={colors.accent} />
      <rect x="12" y="36" width="10" height="20" fill={colors.secondary} />
      <rect x="74" y="36" width="10" height="20" fill={colors.secondary} />

      <path d="M25 15h46v5h6v38h-6v6H25v-6h-6V20h6v-5Z" fill="#07152f" />
      <path d="M28 18h40v4h6v32h-6v6H28v-6h-6V22h6v-4Z" fill={colors.primary} />
      <rect x="29" y="27" width="38" height="18" fill={colors.screen} />
      <rect x="34" y="31" width="9" height="8" fill={colors.light} />
      <rect x="53" y="31" width="9" height="8" fill={colors.light} />
      <rect x="37" y="34" width="3" height="5" fill="#07152f" />
      <rect x="56" y="34" width="3" height="5" fill="#07152f" />

      <rect x="34" y="50" width="28" height="19" fill={colors.secondary} />
      <path d="M40 54h16v12H40V54Z" fill={colors.light} />
      <path
        d="M43 57h10M43 60h10M43 63h7"
        fill="none"
        stroke={colors.primary}
        strokeWidth="2"
      />
      <g className="robot-feet">
        <g className="robot-foot robot-foot-left">
          <rect x="30" y="69" width="14" height="14" fill={colors.primary} />
          <rect x="27" y="81" width="20" height="8" fill={colors.accent} />
          <rect x="25" y="88" width="24" height="4" fill="#07152f" />
        </g>
        <g className="robot-foot robot-foot-right">
          <rect x="52" y="69" width="14" height="14" fill={colors.primary} />
          <rect x="49" y="81" width="20" height="8" fill={colors.accent} />
          <rect x="47" y="88" width="24" height="4" fill="#07152f" />
        </g>
      </g>
    </svg>
  )
}

const robotComponents = {
  scout: ScoutRobot,
  circuit: CircuitRobot,
  orbit: OrbitRobot,
  archive: ArchiveRobot,
}

const robotMotionProfiles = {
  scout: {
    routeDuration: 11,
    stepDuration: 0.78,
    startDelay: 1600,
    actionInterval: 6200,
    emoteDuration: 1050,
    route: {
      x: [0, -8, -20, -28, -17, -4, 0],
      y: [0, -5, -13, -8, -2, 0, 0],
      rotate: [0, -1, -3, -2, 1, 0, 0],
    },
    actions: [
      {
        emote: 'HI',
        motion: {
          rotate: [0, -8, 8, -5, 0],
          scale: [1, 1.04, 1, 1.03, 1],
        },
      },
      {
        emote: 'LOOK',
        motion: {
          x: [0, -3, 0, -3, 0],
          rotate: [0, -5, 5, -2, 0],
        },
      },
    ],
  },
  circuit: {
    routeDuration: 9.5,
    stepDuration: 0.66,
    startDelay: 2400,
    actionInterval: 5900,
    emoteDuration: 1100,
    route: {
      x: [0, -6, -16, -25, -18, -7, 0],
      y: [0, -4, -11, -7, -2, 0, 0],
      rotate: [0, 1, 3, 1, -2, -1, 0],
    },
    actions: [
      {
        emote: 'SCAN',
        motion: {
          x: [0, -3, -1, -3, 0],
          scale: [1, 1.02, 1, 1.02, 1],
        },
      },
      {
        emote: 'SYNC',
        motion: {
          rotate: [0, 5, -5, 3, 0],
          scale: [1, 1.04, 1, 1.04, 1],
        },
      },
    ],
  },
  orbit: {
    routeDuration: 12.5,
    startDelay: 1900,
    actionInterval: 6800,
    emoteDuration: 1150,
    route: {
      x: [0, -9, -22, -30, -20, -7, 0],
      y: [0, -5, -15, -9, -2, 0, 0],
      rotate: [0, -2, -4, -1, 3, 1, 0],
    },
    actions: [
      {
        emote: 'BOOST',
        motion: {
          y: [0, -4, -8, -2, 0],
          scale: [1, 1.04, 1.08, 1.03, 1],
        },
      },
      {
        emote: 'PING',
        motion: {
          rotate: [0, 12, -12, 7, 0],
          scale: [1, 1.06, 1, 1.04, 1],
        },
      },
      {
        emote: 'FLOAT',
        motion: {
          y: [0, -5, 0, -3, 0],
          scale: [1, 1.05, 1, 1.03, 1],
        },
      },
    ],
  },
  archive: {
    routeDuration: 10.5,
    stepDuration: 0.88,
    startDelay: 3000,
    actionInterval: 6400,
    emoteDuration: 1050,
    route: {
      x: [0, -7, -18, -27, -16, -4, 0],
      y: [0, -6, -14, -8, -2, 0, 0],
      rotate: [0, 1, 3, 2, -2, -1, 0],
    },
    actions: [
      {
        emote: 'OK',
        motion: {
          rotate: [0, -6, 6, -4, 0],
          scale: [1, 1.04, 1, 1.02, 1],
        },
      },
      {
        emote: 'FILE',
        motion: {
          x: [0, -3, 0, -2, 0],
          y: [0, -3, 0, -2, 0],
          rotate: [0, 3, -3, 2, 0],
        },
      },
    ],
  },
}

function getRouteAnimation(route, anchor) {
  const yDirection = anchor === 'top-right' ? -1 : 1

  return {
    ...route,
    y: route.y.map((value) => value * yDirection),
  }
}

function RobotEasterEgg({
  variant = 'scout',
  size = 52,
  className = '',
  anchor = 'bottom-right',
}) {
  const safeVariant = robotComponents[variant] ? variant : 'scout'
  const safeAnchor = anchor === 'top-right' ? 'top-right' : 'bottom-right'
  const Robot = robotComponents[safeVariant]
  const colors = robotPalettes[safeVariant]
  const motionProfile = robotMotionProfiles[safeVariant]
  const stageRef = useRef(null)
  const isInView = useInView(stageRef, { margin: '80px 0px', amount: 0.2 })
  const { shouldReduceMotion } = useMotionPreferences()
  const [actionIndex, setActionIndex] = useState(-1)
  const isActive = isInView && !shouldReduceMotion
  const activeAction =
    isActive && actionIndex >= 0 ? motionProfile.actions[actionIndex] : null
  const routeAnimation = useMemo(
    () =>
      isActive
        ? getRouteAnimation(motionProfile.route, safeAnchor)
        : { x: 0, y: 0, rotate: 0 },
    [isActive, motionProfile.route, safeAnchor],
  )

  useEffect(() => {
    let actionTimer
    let emoteTimer
    let cancelled = false

    if (!isActive) {
      const resetTimer = window.setTimeout(() => setActionIndex(-1), 0)
      return () => window.clearTimeout(resetTimer)
    }

    const triggerAction = () => {
      if (cancelled) return

      setActionIndex((current) => (current + 1) % motionProfile.actions.length)
      emoteTimer = window.setTimeout(() => {
        if (!cancelled) setActionIndex(-1)
      }, motionProfile.emoteDuration)
      actionTimer = window.setTimeout(
        triggerAction,
        motionProfile.actionInterval,
      )
    }

    actionTimer = window.setTimeout(triggerAction, motionProfile.startDelay)

    return () => {
      cancelled = true
      window.clearTimeout(actionTimer)
      window.clearTimeout(emoteTimer)
    }
  }, [isActive, motionProfile])

  return (
    <span
      ref={stageRef}
      className={`robot-easter-egg robot-easter-egg-${safeVariant} robot-easter-egg-${safeAnchor} ${className}`.trim()}
      style={{
        width: size,
        height: size,
        '--robot-step-duration': `${motionProfile.stepDuration || 0.72}s`,
      }}
      aria-hidden="true"
    >
      <Motion.span
        className={`robot-easter-egg-body ${
          isActive ? 'robot-easter-egg-body-active' : ''
        }`}
        animate={routeAnimation}
        transition={
          isActive
            ? {
                duration: motionProfile.routeDuration,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatType: 'loop',
              }
            : { duration: 0.2, ease: 'easeOut' }
        }
      >
        <Motion.span
          className="robot-easter-egg-action"
          animate={
            activeAction?.motion || { x: 0, y: 0, rotate: 0, scale: 1 }
          }
          transition={
            activeAction
              ? {
                  duration: motionProfile.emoteDuration / 1000,
                  ease: 'easeInOut',
                }
              : { duration: 0.2, ease: 'easeOut' }
          }
        >
          <Robot colors={colors} />
        </Motion.span>
        <AnimatePresence initial={false}>
          {activeAction && (
            <Motion.span
              key={`${safeVariant}-${actionIndex}`}
              className="robot-easter-egg-emote"
              initial={{ opacity: 0, scale: 0.65, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.72, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {activeAction.emote}
            </Motion.span>
          )}
        </AnimatePresence>
      </Motion.span>
    </span>
  )
}

export default RobotEasterEgg
