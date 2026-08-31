function PixelReactionIcon({ size = 18, className = '', children, ...props }) {
  return (
    <svg
      {...props}
      className={`pixel-reaction-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      shapeRendering="crispEdges"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function PixelLikeIcon(props) {
  return (
    <PixelReactionIcon {...props}>
      <path
        fill="currentColor"
        d="M4 10h5v10H4V10Zm5 0V8h2V5h2V3h3v2h1v5h4v2h1v5h-1v2H9V10Z"
      />
      <path fill="currentColor" fillOpacity="0.42" d="M5 12h2v6H5v-6Zm6-2h2v2h-2v-2Z" />
    </PixelReactionIcon>
  )
}

export function PixelLoveIcon(props) {
  return (
    <PixelReactionIcon {...props}>
      <path
        fill="currentColor"
        d="M4 6h2V4h5v2h2v2h2V6h2V4h5v2h2v7h-2v3h-2v2h-2v2h-2v2h-2v-2h-2v-2H8v-2H6v-3H4V6Z"
      />
      <path fill="#fff" fillOpacity="0.45" d="M7 6h2v2H7V6Zm2 2h2v2H9V8Z" />
    </PixelReactionIcon>
  )
}

export function PixelCelebrateIcon(props) {
  return (
    <PixelReactionIcon {...props}>
      <path
        fill="currentColor"
        d="M5 14h12v2h-2v2h-2v2h-2v2H8v-2H5v-2H3v-2h2v-2Z"
      />
      <path fill="#fff" fillOpacity="0.42" d="M8 15h3v2H9v2H7v-2h1v-2Z" />
      <path fill="currentColor" d="M4 5h2v4H4V5Zm7-2h2v4h-2V3Zm7 4h3v2h-3V7Zm-2-4h2v2h-2V3Z" />
    </PixelReactionIcon>
  )
}

export function PixelWowIcon(props) {
  return (
    <PixelReactionIcon {...props}>
      <path
        fill="currentColor"
        d="M8 3h8v2h3v3h2v8h-2v3h-3v2H8v-2H5v-3H3V8h2V5h3V3Z"
      />
      <path fill="#fff" d="M8 9h2v3H8V9Zm6 0h2v3h-2V9Zm-4 6h4v4h-4v-4Z" />
      <path fill="currentColor" d="M11 16h2v2h-2v-2Z" />
    </PixelReactionIcon>
  )
}

export function PixelSupportIcon(props) {
  return (
    <PixelReactionIcon {...props}>
      <path
        fill="currentColor"
        d="M2 11h4V8h4v2h2v2h2v-2h2V8h4v3h2v8h-4v-2h-2v-2h-2v2h-2v2H8v-2H2v-8Z"
      />
      <path
        fill="#fff"
        fillOpacity="0.42"
        d="M3 13h3v4H3v-4Zm15-2h3v5h-3v-5Zm-8 1h4v2h-4v-2Z"
      />
    </PixelReactionIcon>
  )
}
