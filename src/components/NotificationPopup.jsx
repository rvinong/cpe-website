import { AnimatePresence, motion as Motion } from 'framer-motion'
import { ArrowRight, Bell, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useMotionPreferences } from '../hooks/useMotionPreferences'
import {
  BYTE_PUBLISH_EVENT,
  BYTE_PUBLISH_STORAGE_KEY,
  getRecentBytePublication,
} from '../lib/byteAssistant'

const publicationTypes = {
  announcement: {
    label: 'Announcement',
    href: '/announcements',
    actionLabel: 'View announcements',
  },
  event: {
    label: 'Event',
    href: '/events',
    actionLabel: 'View events',
  },
  'audit report': {
    label: 'Transparency report',
    href: '/internal-audit',
    actionLabel: 'View audit reports',
  },
  resource: {
    label: 'Resource',
    href: '/student-portal',
    actionLabel: 'View resources',
  },
  alumni: {
    label: 'Alumni profile',
    href: '/alumni',
    actionLabel: 'View alumni',
  },
  news: {
    label: 'News story',
    href: '/gallery',
    actionLabel: 'View news',
  },
  gallery: {
    label: 'Gallery update',
    href: '/gallery',
    actionLabel: 'View gallery',
  },
}

function getPublicationNotification(detail) {
  const id = detail?.id ? String(detail.id) : ''
  const title = typeof detail?.title === 'string' ? detail.title.trim() : ''
  const type = typeof detail?.type === 'string' ? detail.type.trim().toLowerCase() : ''

  if (!id || !title) return null

  const publication = publicationTypes[type] || {
    label: 'Content update',
    href: '/',
    actionLabel: 'View update',
  }

  return {
    id: `published-${id}`,
    title,
    ...publication,
  }
}

function NotificationPopup() {
  const [queue, setQueue] = useState([])
  const seenNotificationsRef = useRef(new Set())
  const closeButtonRef = useRef(null)
  const { shouldReduceMotion } = useMotionPreferences()
  const activeNotification = queue[0]
  const activeNotificationId = activeNotification?.id

  useBodyScrollLock(Boolean(activeNotification))

  const dismissNotification = useCallback(() => {
    setQueue((currentQueue) => currentQueue.slice(1))
  }, [])

  const enqueueNotification = useCallback((detail) => {
    const notification = getPublicationNotification(detail)
    if (!notification || seenNotificationsRef.current.has(notification.id)) return

    seenNotificationsRef.current.add(notification.id)
    setQueue((currentQueue) => {
      if (currentQueue.some((item) => item.id === notification.id)) {
        return currentQueue
      }

      if (currentQueue.length < 4) {
        return [...currentQueue, notification]
      }

      return [
        currentQueue[0],
        ...currentQueue.slice(1).slice(-2),
        notification,
      ]
    })
  }, [])

  useEffect(() => {
    const handlePublished = (event) => enqueueNotification(event.detail)
    const handleStorage = (event) => {
      if (event.key !== BYTE_PUBLISH_STORAGE_KEY || !event.newValue) return

      try {
        enqueueNotification(JSON.parse(event.newValue))
      } catch {
        // Ignore malformed values from another tab.
      }
    }

    window.addEventListener(BYTE_PUBLISH_EVENT, handlePublished)
    window.addEventListener('storage', handleStorage)

    const recentPublication = getRecentBytePublication()
    const recentTimer = recentPublication
      ? window.setTimeout(() => enqueueNotification(recentPublication), 700)
      : null

    return () => {
      window.removeEventListener(BYTE_PUBLISH_EVENT, handlePublished)
      window.removeEventListener('storage', handleStorage)
      if (recentTimer) window.clearTimeout(recentTimer)
    }
  }, [enqueueNotification])

  useEffect(() => {
    if (!activeNotificationId) return undefined

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 0)
    const dismissTimer = window.setTimeout(dismissNotification, 7000)

    return () => {
      window.clearTimeout(focusTimer)
      window.clearTimeout(dismissTimer)
    }
  }, [activeNotificationId, dismissNotification])

  useEffect(() => {
    if (!activeNotificationId) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') dismissNotification()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeNotificationId, dismissNotification])

  return (
    <AnimatePresence>
      {activeNotification && (
        <Motion.div
          key="site-notification-layer"
          className="site-notification-layer"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.18 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) dismissNotification()
          }}
        >
          <Motion.section
            className="site-notification-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="site-notification-title"
            aria-describedby="site-notification-copy"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.24 }}
          >
            <div className="site-notification-header">
              <span className="site-notification-icon" aria-hidden="true">
                <Bell size={21} strokeWidth={2.2} />
              </span>
              <div className="site-notification-heading">
                <span className="site-notification-kicker">ICpEP Connect update</span>
                <span className="site-notification-type">{activeNotification.label} published</span>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="site-notification-close"
                onClick={dismissNotification}
                aria-label="Close notification"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="site-notification-content">
              <h2 id="site-notification-title">{activeNotification.title}</h2>
              <p id="site-notification-copy">
                This update is now available on the ICpEP Connect website.
              </p>
            </div>

            <div className="site-notification-actions">
              <Link
                to={activeNotification.href}
                className="site-notification-primary"
                onClick={dismissNotification}
              >
                {activeNotification.actionLabel}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <button
                type="button"
                className="site-notification-secondary"
                onClick={dismissNotification}
              >
                Dismiss
              </button>
            </div>

            {queue.length > 1 && (
              <span className="site-notification-queue">
                {queue.length - 1} more update{queue.length === 2 ? '' : 's'} waiting
              </span>
            )}
          </Motion.section>
        </Motion.div>
      )}
    </AnimatePresence>
  )
}

export default NotificationPopup
