import { useEffect, useState } from 'react'
import { alumniProfiles as fallbackAlumni } from '../data/alumni'
import { getPublicAlumni } from '../lib/alumni'
import { isSupabaseConfigured } from '../lib/supabase'

function useAlumni() {
  const [profiles, setProfiles] = useState(fallbackAlumni)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    let isMounted = true
    getPublicAlumni().then(({ data, error }) => {
      if (!isMounted) return
      if (!error) setProfiles(data)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  return { profiles, isLoading }
}

export default useAlumni
