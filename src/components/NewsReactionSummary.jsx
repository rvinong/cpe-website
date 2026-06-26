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
  SmilePlus,
  ThumbsUp,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import {
  clearNewsReaction,
  getFriendlyReactionError,
  getNewsReactionMembers,
  newsReactionTypes,
  setNewsReaction,
} from '../lib/media'

const reactionIcons = {
  like: ThumbsUp,
  love: Heart,
  celebrate: PartyPopper,
  wow: SmilePlus,
  support: Handshake,
}

const reactionButtonStyles = {
  like: 'text-brand-600 bg-brand-50 border-blue-100',
  love: 'text-rose-600 bg-rose-50 border-rose-100',
  celebrate: 'text-amber-600 bg-amber-50 border-amber-100',
  wow: 'text-violet-600 bg-violet-50 border-violet-100',
  support: 'text-emerald-600 bg-emerald-50 border-emerald-100',
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
  const longPressTimerRef = useRef(null)
  const ignoreNextClickRef = useRef(false)
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

  useBodyScrollLock(isMembersOpen)

  useEffect(
    () => () => {
      window.clearTimeout(longPressTimerRef.current)
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

    const result = nextReaction
      ? await setNewsReaction(newsPostId, nextReaction)
      : await clearNewsReaction(newsPostId)

    if (result.error) {
      updateSummary(previousSummary)
      setReactionError(getFriendlyReactionError(result.error))
    } else {
      updateSummary(result.data)
    }

    setIsReactionPickerOpen(false)
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

  const handleActionPointerDown = (event) => {
    if (event.pointerType === 'mouse') return

    clearLongPressTimer()
    longPressTimerRef.current = window.setTimeout(() => {
      ignoreNextClickRef.current = true
      setIsReactionPickerOpen(true)
    }, 420)
  }

  const handleActionPointerEnd = () => {
    clearLongPressTimer()
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
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.18 }}
            className="absolute bottom-full left-0 z-30 mb-3 flex gap-1.5 rounded-full border border-slate-200 bg-white p-1.5 shadow-[0_18px_55px_-28px_rgba(15,23,42,0.45)]"
          >
            {newsReactionTypes.map(({ id, label }) => {
              const Icon = reactionIcons[id]
              const isActive = summary.userReaction === id

              return (
                <Motion.button
                  key={id}
                  type="button"
                  onClick={() => handleReaction(id)}
                  disabled={isSavingReaction}
                  whileHover={
                    shouldReduceMotion ? undefined : { y: -7, scale: 1.12 }
                  }
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                  className={`group/reaction relative grid ${pickerSizeClass} place-items-center rounded-full border transition disabled:cursor-wait disabled:opacity-60 ${
                    isActive
                      ? 'border-brand-500 shadow-lg shadow-blue-600/15'
                      : 'shadow-sm'
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

  const controls = (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
      <div
        className="relative"
        onMouseEnter={() => setIsReactionPickerOpen(true)}
        onMouseLeave={() => setIsReactionPickerOpen(false)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsReactionPickerOpen(false)
          }
        }}
      >
        {picker}
        <button
          type="button"
          onClick={handleActionClick}
          onPointerDown={handleActionPointerDown}
          onPointerUp={handleActionPointerEnd}
          onPointerCancel={handleActionPointerEnd}
          onPointerLeave={handleActionPointerEnd}
          disabled={isSavingReaction}
          className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold transition disabled:cursor-wait disabled:opacity-70 ${actionButtonClass}`}
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
        <span className="min-w-0 truncate">{summaryText}</span>
      </button>
    </div>
  )

  return (
    <>
      {isDetail ? (
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
            className="fixed inset-0 z-[80] grid place-items-center bg-navy-950/75 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Reaction members"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setIsMembersOpen(false)
            }}
          >
            <Motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
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
                  className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500"
                  aria-label="Close members list"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-5">
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
                  <div className="grid gap-5">
                    {reactionGroups.map((reaction) => {
                      const Icon = reactionIcons[reaction.id]

                      return (
                        <section key={reaction.id} className="grid gap-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`grid size-8 place-items-center rounded-full border ${reactionButtonStyles[reaction.id]}`}
                            >
                              <Icon size={15} aria-hidden="true" />
                            </span>
                            <span className="text-sm font-black text-navy-900">
                              {reaction.label}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              {pluralizeReaction(reaction.count)}
                            </span>
                          </div>

                          {reaction.members.length === 0 ? (
                            <p className="rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-500">
                              No approved member names are available for this
                              reaction yet.
                            </p>
                          ) : (
                            <div className="grid gap-2">
                              {reaction.members.map((member) => {
                                const displayName =
                                  member.profile_id === user?.id
                                    ? 'You'
                                    : member.full_name

                                return (
                                  <div
                                    key={`${reaction.id}-${member.profile_id}-${member.reacted_at}`}
                                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3"
                                  >
                                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-sm font-black text-white">
                                      {displayName.slice(0, 1).toUpperCase()}
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block truncate text-sm font-extrabold text-navy-900">
                                        {displayName}
                                      </span>
                                      <span className="text-xs font-bold text-slate-500">
                                        {reaction.label}
                                      </span>
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </section>
                      )
                    })}
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
