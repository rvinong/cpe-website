import { useEffect, useMemo, useState } from 'react'
import { getStaffAvatarUrl } from '../lib/team'

function getInitials(name) {
  return (name || 'Staff member')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function StaffAvatar({
  path,
  name,
  className = 'size-12 rounded-xl',
  textClassName = 'text-sm',
}) {
  const [image, setImage] = useState({ path: '', url: '' })
  const initials = useMemo(() => getInitials(name), [name])

  useEffect(() => {
    let isMounted = true

    if (!path) {
      return () => {
        isMounted = false
      }
    }

    getStaffAvatarUrl(path).then(({ data }) => {
      if (isMounted) setImage({ path, url: data || '' })
    })

    return () => {
      isMounted = false
    }
  }, [path])

  const imageUrl = image.path === path ? image.url : ''

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${name || 'Staff member'} profile`}
        loading="lazy"
        decoding="async"
        className={`${className} shrink-0 object-cover`}
      />
    )
  }

  return (
    <span
      className={`${className} ${textClassName} grid shrink-0 place-items-center bg-brand-600 font-black text-white`}
      aria-label={`${name || 'Staff member'} profile`}
    >
      {initials}
    </span>
  )
}

export default StaffAvatar
