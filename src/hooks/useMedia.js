import { useEffect, useState } from 'react'
import { galleryPhotos as fallbackGallery } from '../data/gallery'
import { organizationNews as fallbackNews } from '../data/news'
import { getPublicGalleryPhotos, getPublicNews } from '../lib/media'
import { isSupabaseConfigured } from '../lib/supabase'

export function useNews(limit) {
  const fallback = limit ? fallbackNews.slice(0, limit) : fallbackNews
  const [news, setNews] = useState(fallback)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    let isMounted = true
    getPublicNews(limit).then(({ data, error }) => {
      if (!isMounted) return
      if (!error) setNews(data)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [limit])

  return { news, isLoading }
}

export function useGalleryPhotos() {
  const [photos, setPhotos] = useState(fallbackGallery)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    let isMounted = true
    getPublicGalleryPhotos().then(({ data, error }) => {
      if (!isMounted) return
      if (!error) setPhotos(data)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  return { photos, isLoading }
}
