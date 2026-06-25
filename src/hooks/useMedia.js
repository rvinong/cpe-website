import { useCallback, useEffect, useState } from 'react'
import { galleryPhotos as fallbackGallery } from '../data/gallery'
import { organizationNews as fallbackNews } from '../data/news'
import {
  getPublicGalleryPhotos,
  getPublicNews,
  getPublicNewsBySlug,
} from '../lib/media'
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

export function useNewsPost(slug) {
  const [newsPost, setNewsPost] = useState(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState('')

  const loadNewsPost = useCallback(async () => {
    if (!isSupabaseConfigured || !slug) {
      setNewsPost(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const { data, error: loadError } = await getPublicNewsBySlug(slug)
    setNewsPost(loadError ? null : data)
    setError(loadError?.message || '')
    setIsLoading(false)
  }, [slug])

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      if (!isSupabaseConfigured || !slug) {
        if (isMounted) {
          setNewsPost(null)
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      const { data, error: loadError } = await getPublicNewsBySlug(slug)

      if (!isMounted) return
      setNewsPost(loadError ? null : data)
      setError(loadError?.message || '')
      setIsLoading(false)
    }

    load()

    return () => {
      isMounted = false
    }
  }, [slug])

  return { newsPost, isLoading, error, refresh: loadNewsPost, setNewsPost }
}
