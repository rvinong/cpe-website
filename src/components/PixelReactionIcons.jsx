function PixelReactionIcon({ size = 18, className = '', children, ...props }) {
  return (
    <svg
      {...props}
      className={`pixel-reaction-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
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
        d="M5 14h8v13H5V14Zm8 0v-3h2V8h2V4h5v2h2v8h4v2h1v8h-1v2H13V14Z"
      />
      <path fill="currentColor" fillOpacity="0.38" d="M7 16h3v9H7v-9Zm9-3h3v3h-3v-3Z" />
      <path fill="#fff" fillOpacity="0.6" d="M6 16h2v8H6v-8Zm10-5h2v2h-2v-2Zm4-5h2v2h-2V6Z" />
    </PixelReactionIcon>
  )
}

export function PixelLoveIcon(props) {
  return (
    <PixelReactionIcon {...props}>
      <path
        fill="currentColor"
        d="M4 8h2V5h6v2h2v3h4V7h2V5h6v3h2v9h-2v4h-2v3h-3v3h-2v2h-2v-2h-2v-3h-3v-3H9v-4H6v-3H4V8Z"
      />
      <path fill="#fff" fillOpacity="0.62" d="M8 7h3v2H8V7Zm3 2h2v2h-2V9Z" />
      <path fill="currentColor" fillOpacity="0.32" d="M7 17h3v3h2v3h2v2h-2v-2h-3v-3H7v-3Z" />
    </PixelReactionIcon>
  )
}

export function PixelCelebrateIcon(props) {
  return (
    <PixelReactionIcon {...props}>
      <path
        fill="currentColor"
        d="M7 19h6L25 9l-5-5L8 14v5H7Z"
      />
      <path fill="currentColor" fillOpacity="0.38" d="M9 15h5l8-7 2 2-9 8h-6v-3Z" />
      <path fill="#fff" fillOpacity="0.62" d="M12 14h4v2h-4v-2Zm-4 5h4v2H8v-2Z" />
      <path fill="currentColor" d="M4 5h3v5H4V5Zm8-3h3v5h-3V2Zm10 4h4v3h-4V6Zm-2-4h3v3h-3V2Zm7 12h3v3h-3v-3Z" />
    </PixelReactionIcon>
  )
}

export function PixelWowIcon(props) {
  return (
    <PixelReactionIcon {...props}>
      <path
        fill="currentColor"
        d="M10 3h12v2h4v4h3v14h-3v4h-4v3H10v-3H6v-4H3V9h3V5h4V3Z"
      />
      <path fill="#fff" d="M9 11h4v4H9v-4Zm10 0h4v4h-4v-4Zm-6 7h6v6h-6v-6Z" />
      <path fill="currentColor" d="M11 12h1v2h-1v-2Zm10 0h1v2h-1v-2Zm0 7h2v3h-2v-3Z" />
      <path fill="#fff" fillOpacity="0.58" d="M7 8h2v2H7V8Zm17-2h2v2h-2V6Z" />
    </PixelReactionIcon>
  )
}

export function PixelSupportIcon(props) {
  return (
    <PixelReactionIcon {...props}>
      <path
        fill="currentColor"
        d="M3 12h7l4-4h4l4 4h7v14h-7v-3h-3l-3-2-3 2h-3v3H3V12Z"
      />
      <path
        fill="#fff"
        fillOpacity="0.62"
        d="M4 15h4v8H4v-8Zm20-3h4v9h-4v-9Zm-13 1h4v2h3v2h-4v2h-3v-2H9v-2h2v-2Z"
      />
      <path fill="currentColor" fillOpacity="0.36" d="M5 16h2v6H5v-6Zm20-2h2v7h-2v-7Z" />
    </PixelReactionIcon>
  )
}
