import { useEffect, useState } from 'react'
import { pastEvents, upcomingEvents } from '../data/events'
import { getEventTiming, getPublicEvents } from '../lib/events'
import { isSupabaseConfigured } from '../lib/supabase'

const fallbackEvents = [...upcomingEvents, ...pastEvents]

export function useEvents() {
  const [events, setEvents] = useState(fallbackEvents)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    let isMounted = true

    getPublicEvents().then(({ data, error }) => {
      if (!isMounted) return
      if (!error) setEvents(data)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const upcoming = events.filter(
    (event) => getEventTiming(event) === 'upcoming',
  )
  const completed = events
    .filter((event) => getEventTiming(event) === 'completed')
    .sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at))
  const cancelled = events.filter(
    (event) => getEventTiming(event) === 'cancelled',
  )

  return {
    events,
    upcoming,
    completed,
    cancelled,
    isLoading,
  }
}
