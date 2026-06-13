import { useEffect, useState } from 'react'
import { announcements as fallbackAnnouncements } from '../data/announcements'
import {
  getPublicAnnouncement,
  getPublicAnnouncements,
} from '../lib/announcements'
import { isSupabaseConfigured } from '../lib/supabase'

export function useAnnouncements(limit) {
  const fallback = limit
    ? fallbackAnnouncements.slice(0, limit)
    : fallbackAnnouncements
  const [announcements, setAnnouncements] = useState(fallback)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    let isMounted = true

    getPublicAnnouncements(limit).then(({ data, error }) => {
      if (!isMounted) return
      if (!error) setAnnouncements(data)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [limit])

  return { announcements, isLoading }
}

export function useAnnouncement(slug) {
  const fallback =
    fallbackAnnouncements.find((announcement) => announcement.id === slug) ??
    null
  const [result, setResult] = useState({
    slug: isSupabaseConfigured ? null : slug,
    announcement: fallback,
  })

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    let isMounted = true

    getPublicAnnouncement(slug).then(({ data, error }) => {
      if (!isMounted) return
      setResult({
        slug,
        announcement: error ? fallback : data,
      })
    })

    return () => {
      isMounted = false
    }
  }, [fallback, slug])

  const isLoading = isSupabaseConfigured && result.slug !== slug
  const announcement =
    result.slug === slug ? result.announcement : fallback

  return { announcement, isLoading }
}
