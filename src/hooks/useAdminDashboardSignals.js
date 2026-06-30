import { useEffect, useState } from 'react'
import { getAdminAlumni } from '../lib/alumni'
import { getAdminAnnouncements } from '../lib/announcements'
import { getAdminEvents } from '../lib/events'
import { getAdminAuditReports } from '../lib/internalAudit'
import { getAdminGalleryPhotos, getAdminNews } from '../lib/media'
import { getAdminResources } from '../lib/resources'
import { getTeamTasks } from '../lib/team'

export const emptyDashboardSignals = {
  announcements: [],
  events: [],
  resources: [],
  news: [],
  gallery: [],
  alumni: [],
  audit: [],
  tasks: [],
}

const signalSources = [
  ['announcements', 'Announcements', getAdminAnnouncements],
  ['events', 'Events', getAdminEvents],
  ['resources', 'Resources', getAdminResources],
  ['news', 'News', getAdminNews],
  ['gallery', 'Gallery', getAdminGalleryPhotos],
  ['alumni', 'Alumni', getAdminAlumni],
  ['audit', 'Internal Audit', getAdminAuditReports],
  ['tasks', 'Team tasks', getTeamTasks],
]

function normalizeSourceError(result, label) {
  if (result.status === 'rejected') {
    return result.reason?.message || `${label} failed to load`
  }

  return result.value.error?.message || ''
}

function buildDashboardSignals(results) {
  const nextSignals = { ...emptyDashboardSignals }
  const errors = []

  results.forEach((result, index) => {
    const [key, label] = signalSources[index]
    const errorMessage = normalizeSourceError(result, label)

    if (errorMessage) {
      errors.push(errorMessage)
      return
    }

    nextSignals[key] = result.value.data || []
  })

  return {
    dashboardSignals: nextSignals,
    sourceError:
      errors.length > 0
        ? 'Some dashboard analytics sources could not be loaded yet.'
        : '',
  }
}

export function useAdminDashboardSignals(enabled = true) {
  const [state, setState] = useState({
    dashboardSignals: emptyDashboardSignals,
    sourceError: '',
    hasLoaded: false,
    loadedAt: 0,
  })

  useEffect(() => {
    if (!enabled) return undefined

    let isMounted = true

    Promise.allSettled(signalSources.map(([, , load]) => load())).then(
      (results) => {
        if (!isMounted) return

        setState({
          ...buildDashboardSignals(results),
          hasLoaded: true,
          loadedAt: Date.now(),
        })
      },
    )

    return () => {
      isMounted = false
    }
  }, [enabled])

  return {
    dashboardSignals: state.dashboardSignals,
    isLoading: enabled && !state.hasLoaded,
    loadedAt: state.loadedAt,
    sourceError: state.sourceError,
  }
}
