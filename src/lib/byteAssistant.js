export const BYTE_PUBLISH_EVENT = 'byte-assistant:published'
export const BYTE_PUBLISH_STORAGE_KEY = 'byte-assistant-last-publish'

const recentPublishWindow = 2 * 60 * 1000

export function signalBytePublished(type, title) {
  const detail = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    publishedAt: Date.now(),
  }

  try {
    localStorage.setItem(BYTE_PUBLISH_STORAGE_KEY, JSON.stringify(detail))
  } catch {
    // The in-page celebration still works when storage is unavailable.
  }

  window.dispatchEvent(new CustomEvent(BYTE_PUBLISH_EVENT, { detail }))
}

export function getRecentBytePublication() {
  try {
    const detail = JSON.parse(localStorage.getItem(BYTE_PUBLISH_STORAGE_KEY))
    if (!detail?.publishedAt) return null
    return Date.now() - detail.publishedAt <= recentPublishWindow
      ? detail
      : null
  } catch {
    return null
  }
}
