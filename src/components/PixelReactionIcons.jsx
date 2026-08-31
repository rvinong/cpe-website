function ReactionIcon({ size = 18, className = '', children, ...props }) {
  return (
    <svg
      {...props}
      className={`reaction-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      focusable="false"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export function LikeReactionIcon(props) {
  return (
    <ReactionIcon {...props}>
      <path
        fill="currentColor"
        d="M8.5 13.5h3.8V10c0-1.4.6-2.7 1.7-3.6l2-1.6c.9-.7 2.2-.1 2.2 1.1V10c0 .9-.3 1.7-.9 2.4l-.9 1.1h7c1.7 0 2.9 1.6 2.5 3.2l-1.6 7c-.3 1.3-1.5 2.2-2.8 2.2H8.5V13.5Z"
      />
      <path fill="currentColor" d="M4.5 13.5h4v14h-4v-14Z" />
      <path
        d="M6 15.5h1v9H6v-9Zm9.5-4.2c.9-.8 1.9-1.7 2.4-2.7"
        stroke="#fff"
        strokeOpacity="0.58"
        strokeWidth="1.5"
      />
      <path
        d="M10.5 15.5h1.8v8.2h-1.8"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="1.3"
      />
    </ReactionIcon>
  )
}

export function LoveReactionIcon(props) {
  return (
    <ReactionIcon {...props}>
      <path
        fill="currentColor"
        d="M16 27.8 5.9 17.9c-3.7-3.6-3.2-9.7 1-12.3 3-1.8 6.5-.9 9.1 1.5 2.6-2.4 6.1-3.3 9.1-1.5 4.2 2.6 4.7 8.7 1 12.3L16 27.8Z"
      />
      <path
        d="M8 10.5c.3-1.2 1.2-2.2 2.4-2.6 1.1-.4 2.2-.1 3.1.6"
        stroke="#fff"
        strokeOpacity="0.72"
        strokeWidth="1.8"
      />
      <path
        d="M8 17.5 16 25l8-7.5"
        stroke="currentColor"
        strokeOpacity="0.34"
        strokeWidth="1.4"
      />
    </ReactionIcon>
  )
}

export function CelebrateReactionIcon(props) {
  return (
    <ReactionIcon {...props}>
      <path
        fill="currentColor"
        d="M6.7 23.6 22.3 7.8l3.9 3.9-15.6 15.6c-1.3 1.2-3.5.3-3.5-1.5v-2.2Z"
      />
      <path
        d="m10 21.9 2.1 2.1 10.2-10.3-2.1-2.1L10 21.9Z"
        fill="#fff"
        fillOpacity="0.56"
      />
      <path
        d="M6.2 20.8 10 24.6"
        stroke="#fff"
        strokeOpacity="0.7"
        strokeWidth="1.6"
      />
      <circle cx="6.5" cy="7" r="1.5" fill="currentColor" />
      <path d="M13 3v4M24.5 5v3M26.5 15h2.8" stroke="currentColor" strokeWidth="2" />
      <path d="m20 3 1.7 1.7M5 12l-2 1.4" stroke="currentColor" strokeWidth="1.8" />
    </ReactionIcon>
  )
}

export function WowReactionIcon(props) {
  return (
    <ReactionIcon {...props}>
      <circle cx="16" cy="16" r="11.5" fill="currentColor" />
      <path
        d="m10.1 11.8 2.3-.9m7.2 0 2.3.9"
        stroke="#fff"
        strokeOpacity="0.8"
        strokeWidth="1.8"
      />
      <circle cx="11.8" cy="15.4" r="1.8" fill="#fff" />
      <circle cx="20.2" cy="15.4" r="1.8" fill="#fff" />
      <circle cx="11.8" cy="15.4" r="0.75" fill="currentColor" />
      <circle cx="20.2" cy="15.4" r="0.75" fill="currentColor" />
      <ellipse cx="16" cy="21" rx="2.8" ry="3.4" fill="#fff" />
      <path d="M15 20h2v3h-2v-3Z" fill="currentColor" />
      <path d="M7 8.5h2M23 8.5h2" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" />
    </ReactionIcon>
  )
}

export function SupportReactionIcon(props) {
  return (
    <ReactionIcon {...props}>
      <path
        fill="currentColor"
        d="m3.8 13.1 4.7-4.7h5.1l2.3 2.3 2.3-2.3h5.3l4.7 4.7-3.4 3.4-2.4-2.4-2.1 2.1 1.4 1.4-1.6 1.6-2.9-2.9-2.4 2.4-2.3-2.3-2.1 2.1-4.4-4.4 3.8-3.8Z"
      />
      <path
        fill="#fff"
        fillOpacity="0.66"
        d="m5.2 13.7 3.2-3.2 3.2 3.2-3.2 3.2-3.2-3.2Zm13.2-3.2 3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2Z"
      />
      <path
        d="m11.4 14.4 2.3 2.3c.9.9 2.4.9 3.3 0l2.1-2.1"
        stroke="#fff"
        strokeOpacity="0.82"
        strokeWidth="1.6"
      />
      <path d="m7.5 19.5 2.2 2.2m14.8-2.2-2.2 2.2" stroke="currentColor" strokeOpacity="0.42" strokeWidth="1.5" />
    </ReactionIcon>
  )
}
