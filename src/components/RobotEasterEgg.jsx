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
      <rect x="30" y="80" width="13" height="7" fill={colors.secondary} />
      <rect x="53" y="80" width="13" height="7" fill={colors.secondary} />
      <rect x="27" y="87" width="18" height="4" fill="#07152f" />
      <rect x="51" y="87" width="18" height="4" fill="#07152f" />
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
      <rect x="34" y="68" width="10" height="15" fill={colors.primary} />
      <rect x="52" y="68" width="10" height="15" fill={colors.primary} />
      <rect x="30" y="81" width="18" height="7" fill={colors.accent} />
      <rect x="48" y="81" width="18" height="7" fill={colors.accent} />
      <rect x="27" y="88" width="24" height="4" fill="#07152f" />
      <rect x="45" y="88" width="24" height="4" fill="#07152f" />
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
      <rect x="30" y="71" width="13" height="6" fill={colors.secondary} />
      <rect x="53" y="71" width="13" height="6" fill={colors.secondary} />
      <path d="M35 79h10v8H35v-8Zm20 0h10v8H55v-8Z" fill="#07152f" />
      <rect x="39" y="82" width="6" height="4" fill={colors.accent} />
      <rect x="55" y="82" width="6" height="4" fill={colors.accent} />
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
      <rect x="30" y="69" width="14" height="14" fill={colors.primary} />
      <rect x="52" y="69" width="14" height="14" fill={colors.primary} />
      <rect x="27" y="81" width="20" height="8" fill={colors.accent} />
      <rect x="49" y="81" width="20" height="8" fill={colors.accent} />
      <rect x="25" y="88" width="24" height="4" fill="#07152f" />
      <rect x="47" y="88" width="24" height="4" fill="#07152f" />
    </svg>
  )
}

const robotComponents = {
  scout: ScoutRobot,
  circuit: CircuitRobot,
  orbit: OrbitRobot,
  archive: ArchiveRobot,
}

function RobotEasterEgg({ variant = 'scout', size = 52, className = '' }) {
  const Robot = robotComponents[variant] || ScoutRobot
  const colors = robotPalettes[variant] || robotPalettes.scout

  return (
    <span
      className={`robot-easter-egg robot-easter-egg-${variant} ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Robot colors={colors} />
    </span>
  )
}

export default RobotEasterEgg
