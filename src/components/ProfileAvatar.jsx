import { useEffect, useMemo, useState } from 'react'
import {
  getInitials,
  getProfileAvatarUrlCandidates,
} from '../lib/accountProfile'

function ProfileAvatar({
  path,
  name,
  fallbackLabel = 'Member',
  className = 'size-12 rounded-xl',
  textClassName = 'text-sm',
  imageClassName = '',
}) {
  const [image, setImage] = useState({ path: '', urls: [], index: 0 })
  const initials = useMemo(
    () => getInitials(name, fallbackLabel[0]?.toUpperCase() || 'M'),
    [fallbackLabel, name],
  )

  useEffect(() => {
    let isMounted = true

    if (!path) {
      return () => {
        isMounted = false
      }
    }

    getProfileAvatarUrlCandidates(path).then(({ data }) => {
      if (isMounted) setImage({ path, urls: data || [], index: 0 })
    })

    return () => {
      isMounted = false
    }
  }, [path])

  const imageUrl = image.path === path ? image.urls[image.index] : ''

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${name || fallbackLabel} profile`}
        loading="lazy"
        decoding="async"
        onError={() =>
          setImage((current) =>
            current.path === path
              ? { ...current, index: current.index + 1 }
              : current,
          )
        }
        className={`${className} ${imageClassName} shrink-0 object-cover`}
      />
    )
  }

  return (
    <span
      className={`${className} ${textClassName} grid shrink-0 place-items-center bg-brand-600 font-black text-white`}
      aria-label={`${name || fallbackLabel} profile`}
    >
      {initials}
    </span>
  )
}

export default ProfileAvatar
