import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fallbackOrganization,
  getOrganizationContent,
} from '../lib/organization'
import { isSupabaseConfigured } from '../lib/supabase'
import OrganizationContext from './organization-context'

function OrganizationProvider({ children }) {
  const [content, setContent] = useState(fallbackOrganization)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    const result = await getOrganizationContent()
    setContent(result.data)
    setError(result.error)
    setIsLoading(false)
    return result
  }, [])

  useEffect(() => {
    let isMounted = true

    getOrganizationContent().then((result) => {
      if (!isMounted) return
      setContent(result.data)
      setError(result.error)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const value = useMemo(
    () => ({
      ...content,
      isLoading,
      error,
      refresh,
    }),
    [content, error, isLoading, refresh],
  )

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export default OrganizationProvider
