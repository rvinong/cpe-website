import {
  AnimatePresence,
  motion as Motion,
  useReducedMotion,
} from 'framer-motion'
import {
  Handshake,
  Heart,
  LogIn,
  PartyPopper,
  ThumbsUp,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import {
  clearNewsReaction,
  getFriendlyReactionError,
  getNewsReactionMembers,
  newsReactionTypes,
  setNewsReaction,
} from '../lib/media'
import ProfileAvatar from './ProfileAvatar'

const reactionButtonStyles = {
  like: 'text-brand-600 bg-brand-50 border-blue-300',
  love: 'text-rose-600 bg-rose-50 border-rose-300',
  celebrate: 'text-amber-600 bg-amber-50 border-amber-300',
  wow: 'text-violet-600 bg-violet-50 border-violet-300',
  support: 'text-emerald-600 bg-emerald-50 border-emerald-300',
}

const touchReactionActiveClass = 'reaction-touch-active'

function WowReactionIcon({ size = 18, className = '', style, ...props }) {
  return (
    <span
      {...props}
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(12, size * 0.86),
        lineHeight: 1,
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        className="block leading-none"
        style={{
          transform: 'translateY(-0.04em)',
        }}
      >
        {'\u{1F62E}'}
      </span>
    </span>
  )
}

const reactionIcons = {
  like: ThumbsUp,
  love: Heart,
  celebrate: PartyPopper,
  wow: WowReactionIcon,
  support: Handshake,
}

function createDefaultReactionSummary(total = 0) {
  return {
    counts: Object.fromEntries(newsReactionTypes.map(({ id }) => [id, 0])),
    reactorNames: Object.fromEntries(
      newsReactionTypes.map(({ id }) => [id, []]),
    ),
    total,
    userReaction: '',
  }
}

function normalizeSummary(summary) {
  const fallback = createDefaultReactionSummary(Number(summary?.total) || 0)

  return {
    ...fallback,
    ...summary,
    counts: {
      ...fallback.counts,
      ...(summary?.counts || {}),
    },
    reactorNames: {
      ...fallback.reactorNames,
      ...(summary?.reactorNames || {}),
    },
    userReaction: summary?.userReaction || '',
  }
}

function getOptimisticReactionSummary(summary, nextReaction) {
  const normalizedSummary = normalizeSummary(summary)
  const counts = { ...normalizedSummary.counts }
  const currentReaction = normalizedSummary.userReaction

  if (currentReaction && counts[currentReaction] > 0) {
    counts[currentReaction] -= 1
  }

  if (nextReaction) {
    counts[nextReaction] = (counts[nextReaction] || 0) + 1
  }

  return {
    ...normalizedSummary,
    counts,
    total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    userReaction: nextReaction,
  }
}

function getTopReactions(summary, limit = 3) {
  const normalizedSummary = normalizeSummary(summary)

  return newsReactionTypes
    .map((reaction, index) => ({
      ...reaction,
      count: Number(normalizedSummary.counts[reaction.id]) || 0,
      index,
    }))
    .filter((reaction) => reaction.count > 0)
    .sort(
      (first, second) =>
        second.count - first.count || first.index - second.index,
    )
    .slice(0, limit)
}

function getPreviewNames(summary) {
  const normalizedSummary = normalizeSummary(summary)
  const names = []

  getTopReactions(normalizedSummary, newsReactionTypes.length).forEach(
    ({ id }) => {
      const namesForReaction = normalizedSummary.reactorNames[id] || []

      namesForReaction.forEach((name) => {
        const cleanName = String(name || '').trim()
        if (cleanName && !names.includes(cleanName)) names.push(cleanName)
      })
    },
  )

  return names
}

function pluralizeReaction(count) {
  return `${count} ${count === 1 ? 'reaction' : 'reactions'}`
}

function pluralizeOther(count) {
  return `${count} ${count === 1 ? 'other' : 'others'}`
}

function getReactionText(summary) {
  const normalizedSummary = normalizeSummary(summary)
  const total = Number(normalizedSummary.total) || 0
  const [firstName] = getPreviewNames(normalizedSummary)
  const hasUserReaction = Boolean(normalizedSummary.userReaction)
  const otherCount = hasUserReaction ? Math.max(total - 1, 0) : total

  if (total <= 0) return 'Be first to react'

  if (hasUserReaction) {
    if (otherCount === 0) return 'You'
    if (otherCount === 1 && firstName) return `You and ${firstName}`
    return `You and ${pluralizeOther(otherCount)}`
  }

  if (total === 1 && firstName) return firstName
  if (firstName) return `${firstName} and ${pluralizeOther(total - 1)}`

  return pluralizeReaction(total)
}

function NewsReactionSummary({
  className = '',
  initialSummary,
  middleSlot = null,
  newsPostId,
  onSummaryChange,
  variant = 'card',
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()
  const { user } = useAuth()
  const [summary, setSummary] = useState(() =>
    normalizeSummary(initialSummary),
  )
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false)
  const [isSavingReaction, setIsSavingReaction] = useState(false)
  const [reactionError, setReactionError] = useState('')
  const [isMembersOpen, setIsMembersOpen] = useState(false)
  const [reactionGroups, setReactionGroups] = useState([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [memberError, setMemberError] = useState('')
  const [selectedMembersFilter, setSelectedMembersFilter] = useState('all')
  const longPressTimerRef = useRef(null)
  const ignoredClickResetTimerRef = useRef(null)
  const ignoreNextClickRef = useRef(false)
  const isTouchPickingRef = useRef(false)
  const highlightedReactionRef = useRef('')
  const pickerRailRef = useRef(null)
  const actionButtonRef = useRef(null)
  const reactionButtonRefs = useRef({})
  const [highlightedReaction, setHighlightedReaction] = useState('')
  const isDetail = variant === 'detail'
  const topReactions = useMemo(() => getTopReactions(summary), [summary])
  const allPositiveReactions = useMemo(
    () => getTopReactions(summary, newsReactionTypes.length),
    [summary],
  )
  const activeReaction =
    newsReactionTypes.find((reaction) => reaction.id === summary.userReaction) ||
    null
  const ActiveReactionIcon = activeReaction
    ? reactionIcons[activeReaction.id]
    : ThumbsUp
  const summaryText = getReactionText(summary)
  const reactionMemberRows = useMemo(
    () =>
      reactionGroups.flatMap((reaction) =>
        reaction.members.map((member) => ({
          ...member,
          reactionId: reaction.id,
          reactionLabel: reaction.label,
          reactionCount: reaction.count,
        })),
      ),
    [reactionGroups],
  )
  const memberFilterTabs = useMemo(
    () => [
      { id: 'all', label: 'All', count: summary.total },
      ...reactionGroups.map((reaction) => ({
        id: reaction.id,
        label: reaction.label,
        count: reaction.count,
      })),
    ],
    [reactionGroups, summary.total],
  )
  const visibleReactionMembers = useMemo(
    () =>
      selectedMembersFilter === 'all'
        ? reactionMemberRows
        : reactionMemberRows.filter(
            (member) => member.reactionId === selectedMembersFilter,
          ),
    [reactionMemberRows, selectedMembersFilter],
  )

  useEffect(
    () => () => {
      window.clearTimeout(longPressTimerRef.current)
      window.clearTimeout(ignoredClickResetTimerRef.current)
      document.documentElement.classList.remove(touchReactionActiveClass)
    },
    [],
  )

  const loginRedirect = () => {
    navigate(
      `/account?mode=login&redirect=${encodeURIComponent(
        `${location.pathname}${location.search}`,
      )}`,
    )
  }

  const updateSummary = (nextSummary) => {
    const normalizedSummary = normalizeSummary(nextSummary)
    setSummary(normalizedSummary)
    onSummaryChange?.(normalizedSummary)
  }

  const handleReaction = async (reactionType) => {
    if (!newsPostId) return

    if (!user) {
      loginRedirect()
      return
    }

    setReactionError('')
    setIsSavingReaction(true)

    const previousSummary = summary
    const nextReaction =
      previousSummary.userReaction === reactionType ? '' : reactionType
    updateSummary(getOptimisticReactionSummary(previousSummary, nextReaction))
    setIsReactionPickerOpen(false)

    const result = nextReaction
      ? await setNewsReaction(newsPostId, nextReaction)
      : await clearNewsReaction(newsPostId)

    if (result.error) {
      updateSummary(previousSummary)
      setReactionError(getFriendlyReactionError(result.error))
    } else {
      updateSummary(result.data)
    }

    setIsSavingReaction(false)
  }

  const openMembers = async () => {
    if (!newsPostId || summary.total <= 0) return

    if (!user) {
      loginRedirect()
      return
    }

    const groupsToLoad = allPositiveReactions
    setIsMembersOpen(true)
    setReactionGroups([])
    setMemberError('')
    setSelectedMembersFilter('all')
    setIsLoadingMembers(true)

    const results = await Promise.all(
      groupsToLoad.map(({ id }) => getNewsReactionMembers(newsPostId, id)),
    )

    const firstError = results.find((result) => result.error)?.error

    setReactionGroups(
      groupsToLoad.map((reaction, index) => ({
        ...reaction,
        members: results[index].error ? [] : results[index].data || [],
      })),
    )
    setMemberError(firstError ? getFriendlyReactionError(firstError) : '')
    setIsLoadingMembers(false)
  }

  const clearLongPressTimer = () => {
    window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }

  const setTouchReactionActive = (isActive) => {
    document.documentElement.classList.toggle(
      touchReactionActiveClass,
      isActive,
    )
  }

  const resetIgnoredClickSoon = () => {
    window.clearTimeout(ignoredClickResetTimerRef.current)
    ignoredClickResetTimerRef.current = window.setTimeout(() => {
      ignoreNextClickRef.current = false
    }, 220)
  }

  const setTouchHighlightedReaction = (reactionId) => {
    highlightedReactionRef.current = reactionId
    setHighlightedReaction(reactionId)
  }

  const getReactionFromRail = (clientX, clientY) => {
    const railNode = pickerRailRef.current
    const actionNode = actionButtonRef.current
    if (!railNode) return ''

    const rect = railNode.getBoundingClientRect()
    const actionRect = actionNode?.getBoundingClientRect()
    const horizontalPadding = 34
    const topPadding = 18
    const bottomEdge = actionRect
      ? actionRect.bottom + 22
      : rect.bottom + 132

    const isInsideRail =
      clientX >= rect.left - horizontalPadding &&
      clientX <= rect.right + horizontalPadding &&
      clientY >= rect.top - topPadding &&
      clientY <= bottomEdge

    if (!isInsideRail) return ''

    const clampedX = Math.min(
      Math.max(clientX, rect.left),
      rect.right,
    )
    const segmentWidth = rect.width / newsReactionTypes.length
    const reactionIndex = Math.min(
      newsReactionTypes.length - 1,
      Math.max(0, Math.floor((clampedX - rect.left) / segmentWidth)),
    )

    return newsReactionTypes[reactionIndex]?.id || ''
  }

  const getReactionAtPoint = (clientX, clientY) => {
    const directReaction = newsReactionTypes.find(({ id }) => {
      const node = reactionButtonRefs.current[id]
      if (!node) return false

      const rect = node.getBoundingClientRect()
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      )
    })?.id

    return directReaction || getReactionFromRail(clientX, clientY)
  }

  const handleActionPointerDown = (event) => {
    if (event.pointerType === 'mouse' || isSavingReaction) return

    event.stopPropagation()
    setTouchReactionActive(true)
    clearLongPressTimer()
    setTouchHighlightedReaction('')

    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Some browsers may not support capture on this target; pointer move
      // still works while the finger stays over the control.
    }

    longPressTimerRef.current = window.setTimeout(() => {
      ignoreNextClickRef.current = true
      isTouchPickingRef.current = true
      setIsReactionPickerOpen(true)
    }, 420)
  }

  const handleActionPointerMove = (event) => {
    if (event.pointerType === 'mouse') return

    if (!isTouchPickingRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setTouchHighlightedReaction(
      getReactionAtPoint(event.clientX, event.clientY),
    )
  }

  const handleActionPointerEnd = (event) => {
    if (event.pointerType === 'mouse') return

    event.stopPropagation()
    clearLongPressTimer()
    setTouchReactionActive(false)

    if (!isTouchPickingRef.current) return

    event.preventDefault()
    const selectedReaction =
      getReactionAtPoint(event.clientX, event.clientY) ||
      highlightedReactionRef.current

    isTouchPickingRef.current = false
    setTouchHighlightedReaction('')
    setIsReactionPickerOpen(false)

    if (selectedReaction) {
      handleReaction(selectedReaction)
    }

    resetIgnoredClickSoon()
  }

  const handleActionPointerCancel = (event) => {
    if (event.pointerType === 'mouse') return

    clearLongPressTimer()
    setTouchReactionActive(false)
    isTouchPickingRef.current = false
    ignoreNextClickRef.current = true
    setTouchHighlightedReaction('')
    setIsReactionPickerOpen(false)
    resetIgnoredClickSoon()
  }

  const handleActionPointerLeave = (event) => {
    if (event.pointerType === 'mouse') return
    if (isTouchPickingRef.current) return

    clearLongPressTimer()
    setTouchReactionActive(false)
  }

  const handleActionClick = () => {
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false
      return
    }

    handleReaction(activeReaction?.id || 'like')
  }

  const pickerSizeClass = isDetail ? 'size-12 sm:size-14' : 'size-10'
  const pickerIconSize = isDetail ? 22 : 18
  const actionButtonClass =
    'border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-brand-50/60 hover:text-brand-600'

  const picker = (
    <AnimatePresence>
      {isReactionPickerOpen && (
        <>
          <span
            className="absolute bottom-full left-0 h-4 w-full"
            aria-hidden="true"
          />
          <Motion.div
            ref={pickerRailRef}
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.18 }}
            className="absolute bottom-full left-0 z-30 mb-3 flex gap-1.5 rounded-full border border-slate-200 bg-white p-1.5 shadow-[0_18px_55px_-28px_rgba(15,23,42,0.45)]"
          >
            <span
              className="pointer-events-none absolute -inset-x-8 -top-4 -bottom-32"
              aria-hidden="true"
            />
            {newsReactionTypes.map(({ id, label }) => {
              const Icon = reactionIcons[id]
              const isActive = summary.userReaction === id
              const isHighlighted = highlightedReaction === id

              return (
                <Motion.button
                  key={id}
                  ref={(node) => {
                    if (node) reactionButtonRefs.current[id] = node
                    else delete reactionButtonRefs.current[id]
                  }}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    if (isTouchPickingRef.current || ignoreNextClickRef.current) {
                      ignoreNextClickRef.current = false
                      return
                    }

                    handleReaction(id)
                  }}
                  disabled={isSavingReaction}
                  whileHover={
                    shouldReduceMotion ? undefined : { y: -7, scale: 1.12 }
                  }
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                  onContextMenu={(event) => event.preventDefault()}
                  className={`group/reaction relative grid ${pickerSizeClass} touch-none select-none place-items-center rounded-full border transition disabled:cursor-wait disabled:opacity-60 ${
                    isActive || isHighlighted
                      ? 'border-brand-500 shadow-lg shadow-blue-600/15'
                      : 'shadow-sm'
                  } ${
                    isHighlighted
                      ? '-translate-y-1 scale-110 ring-2 ring-navy-900/15'
                      : ''
                  } ${reactionButtonStyles[id]}`}
                  aria-label={`React with ${label}`}
                >
                  <Icon size={pickerIconSize} aria-hidden="true" />
                  <span className="pointer-events-none absolute -top-8 rounded-full bg-navy-950 px-2.5 py-1 text-[10px] font-extrabold text-white opacity-0 shadow-lg transition group-hover/reaction:opacity-100">
                    {label}
                  </span>
                </Motion.button>
              )
            })}
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  )

  const reactionAction = (
    <div
      className="relative touch-none select-none"
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setIsReactionPickerOpen(true)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setIsReactionPickerOpen(false)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsReactionPickerOpen(false)
        }
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {picker}
      <button
        ref={actionButtonRef}
        type="button"
        onClick={handleActionClick}
        onPointerDown={handleActionPointerDown}
        onPointerMove={handleActionPointerMove}
        onPointerUp={handleActionPointerEnd}
        onPointerCancel={handleActionPointerCancel}
        onPointerLeave={handleActionPointerLeave}
        onContextMenu={(event) => event.preventDefault()}
        disabled={isSavingReaction}
        className={`inline-flex min-h-9 touch-none select-none items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold transition disabled:cursor-wait disabled:opacity-70 ${actionButtonClass}`}
      >
        {activeReaction ? (
          <span
            className={`grid size-6 place-items-center rounded-full border-2 border-white ${reactionButtonStyles[activeReaction.id]}`}
          >
            <ActiveReactionIcon size={12} aria-hidden="true" />
          </span>
        ) : (
          <ActiveReactionIcon size={14} aria-hidden="true" />
        )}
        {activeReaction?.label || 'Like'}
      </button>
    </div>
  )

  const reactionMembersButton = (
    <button
      type="button"
      onClick={summary.total > 0 ? openMembers : undefined}
      disabled={isSavingReaction}
      title={summary.total > 0 ? 'View reactions' : 'No reactions yet'}
      className={`inline-flex min-h-9 max-w-full items-center gap-2 rounded-full px-1.5 py-1 text-xs font-extrabold text-slate-500 transition hover:text-brand-600 disabled:cursor-wait disabled:opacity-70 ${
        isDetail ? 'text-sm' : ''
      }`}
    >
      {topReactions.length > 0 ? (
        <span className="flex shrink-0 -space-x-1.5">
          {topReactions.map(({ id }) => {
            const Icon = reactionIcons[id]
            return (
              <span
                key={id}
                className={`grid size-6 place-items-center rounded-full border-2 border-white ${reactionButtonStyles[id]}`}
              >
                <Icon size={12} aria-hidden="true" />
              </span>
            )
          })}
        </span>
      ) : (
        <span className="grid size-6 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-400">
          <ThumbsUp size={12} aria-hidden="true" />
        </span>
      )}
      {variant !== 'comments' && (
        <span className="min-w-0 truncate">{summaryText}</span>
      )}
    </button>
  )

  const controls =
    variant === 'comments' ? (
      <div className="news-reaction-controls flex min-w-0 flex-wrap items-center gap-3">
        {reactionAction}
        {middleSlot}
        <span className="ml-auto">{reactionMembersButton}</span>
      </div>
    ) : (
      <div className="news-reaction-controls flex min-w-0 flex-wrap items-center justify-between gap-2">
        {reactionAction}
        {reactionMembersButton}
      </div>
    )

  return (
    <>
      {variant === 'comments' ? (
        <div className={`min-w-0 ${className}`} aria-label="News reactions">
          {controls}
          {reactionError && (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              {reactionError}
            </p>
          )}
        </div>
      ) : isDetail ? (
        <section
          className={`border-y border-slate-100 py-3 ${className}`}
          aria-label="News reactions"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            {controls}
            {!user && (
              <button
                type="button"
                onClick={loginRedirect}
                className="inline-flex items-center gap-2 text-xs font-extrabold text-brand-600"
              >
                <LogIn size={15} aria-hidden="true" />
                Sign in to react
              </button>
            )}
          </div>
          {reactionError && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              {reactionError}
            </p>
          )}
        </section>
      ) : (
        <div className={`min-w-0 ${className}`}>
          {controls}
          {reactionError && (
            <p className="mt-2 text-xs font-bold text-amber-700">
              {reactionError}
            </p>
          )}
        </div>
      )}

      <AnimatePresence>
        {isMembersOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[80] overflow-y-auto bg-navy-950/75 p-4 backdrop-blur-sm sm:p-6"
          >
            <Motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              className="pointer-events-auto mx-auto my-4 flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl sm:my-8 sm:max-h-[calc(100dvh-4rem)]"
              role="dialog"
              aria-modal="false"
              aria-label="Reaction members"
            >
              <div className="shrink-0 border-b border-slate-200 bg-white px-5 pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                      Community reactions
                    </p>
                    <h2 className="mt-1 text-xl font-black text-navy-900">
                      {pluralizeReaction(summary.total)}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMembersOpen(false)}
                    className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-navy-900"
                    aria-label="Close members list"
                  >
                    <X size={19} />
                  </button>
                </div>

                {memberFilterTabs.length > 0 && (
                  <div
                    className="mt-4 flex gap-1 overflow-x-auto"
                    aria-label="Filter reactions"
                  >
                    {memberFilterTabs.map((tab) => {
                      const isActive = selectedMembersFilter === tab.id
                      const Icon =
                        tab.id === 'all' ? null : reactionIcons[tab.id]

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSelectedMembersFilter(tab.id)}
                          className={`relative inline-flex shrink-0 items-center gap-2 px-3 pb-3 pt-1 text-sm font-black transition ${
                            isActive
                              ? 'text-brand-600'
                              : 'text-slate-500 hover:text-navy-900'
                          }`}
                          aria-pressed={isActive}
                        >
                          {Icon ? (
                            <span
                              className={`grid size-7 place-items-center rounded-full border-2 border-white shadow-sm ${
                                reactionButtonStyles[tab.id]
                              }`}
                            >
                              <Icon size={14} aria-hidden="true" />
                            </span>
                          ) : (
                            <span>All</span>
                          )}
                          <span>{tab.count}</span>
                          {isActive && (
                            <span className="absolute inset-x-2 bottom-0 h-1 rounded-full bg-brand-600" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="reaction-members-scroll min-h-0 flex-1 overflow-y-auto p-5">
                {isLoadingMembers ? (
                  <p className="rounded-xl bg-brand-50 p-4 text-sm font-bold text-brand-600">
                    Loading members...
                  </p>
                ) : memberError ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                    {memberError}
                  </p>
                ) : reactionGroups.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-blue-200 bg-brand-50/35 p-4 text-sm leading-6 text-slate-600">
                    No approved member names are available yet.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {visibleReactionMembers.length === 0 ? (
                      <p className="rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-500">
                        No approved member names are available for this
                        reaction yet.
                      </p>
                    ) : (
                      visibleReactionMembers.map((member) => {
                        const Icon =
                          reactionIcons[member.reactionId] || ThumbsUp
                        const displayName = member.full_name || 'Member'
                        const isCurrentUser = member.profile_id === user?.id

                        return (
                          <div
                            key={`${member.reactionId}-${member.profile_id}-${member.reacted_at}`}
                            className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50/70 px-3 py-3 transition hover:border-brand-200 hover:bg-white"
                          >
                            <span className="relative shrink-0">
                              <ProfileAvatar
                                path={member.avatar_path}
                                name={displayName}
                                className="size-11 rounded-full ring-2 ring-white"
                                textClassName="text-sm"
                              />
                              <span
                                className={`absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-white shadow-sm ${
                                  reactionButtonStyles[member.reactionId]
                                }`}
                              >
                                <Icon size={12} aria-hidden="true" />
                              </span>
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex min-w-0 items-center gap-2">
                                <span className="truncate text-sm font-extrabold text-navy-900">
                                  {displayName}
                                </span>
                                {isCurrentUser && (
                                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-black text-brand-600">
                                    You
                                  </span>
                                )}
                              </span>
                              <span className="mt-0.5 block text-xs font-bold text-slate-500">
                                {member.reactionLabel}
                              </span>
                            </span>
                            <span className="hidden rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-slate-500 ring-1 ring-slate-200 sm:inline-flex">
                              Member
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default NewsReactionSummary
