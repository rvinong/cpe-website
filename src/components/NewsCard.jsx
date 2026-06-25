import {
  AnimatePresence,
  motion as Motion,
  useReducedMotion,
} from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  Handshake,
  Heart,
  PartyPopper,
  SmilePlus,
  Star,
  ThumbsUp,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import {
  clearNewsReaction,
  getFriendlyReactionError,
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
    total,
    userReaction: '',
  }
}

function getInitialReactionSummary(article) {
  return (
    article.reactions ||
    createDefaultReactionSummary(Number(article.reactionTotal) || 0)
  )
}

function getOptimisticReactionSummary(summary, nextReaction) {
  const counts = { ...summary.counts }
  const currentReaction = summary.userReaction

  if (currentReaction && counts[currentReaction] > 0) {
    counts[currentReaction] -= 1
  }

  if (nextReaction) {
    counts[nextReaction] = (counts[nextReaction] || 0) + 1
  }

  return {
    counts,
    total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    userReaction: nextReaction,
  }
}

function NewsCard({ article, compact = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()
  const { user } = useAuth()
  const [reactionSummary, setReactionSummary] = useState(() =>
    getInitialReactionSummary(article),
  )
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false)
  const [isSavingReaction, setIsSavingReaction] = useState(false)
  const [reactionError, setReactionError] = useState('')
  const storyHref = `/gallery/news/${article.slug}`
  const activeReaction =
    newsReactionTypes.find(
      (reaction) => reaction.id === reactionSummary.userReaction,
    ) || null
  const ActiveReactionIcon = activeReaction
    ? reactionIcons[activeReaction.id]
    : ThumbsUp
  const reactionTotalLabel = `${reactionSummary.total || 0} ${
    reactionSummary.total === 1 ? 'reaction' : 'reactions'
  }`

  const loginRedirect = () => {
    navigate(
      `/account?mode=login&redirect=${encodeURIComponent(location.pathname)}`,
    )
  }

  const handleReaction = async (reactionType) => {
    if (!article.id) return

    if (!user) {
      loginRedirect()
      return
    }

    setReactionError('')
    setIsSavingReaction(true)

    const previousSummary = reactionSummary
    const nextReaction =
      previousSummary.userReaction === reactionType ? '' : reactionType

    setReactionSummary(
      getOptimisticReactionSummary(previousSummary, nextReaction),
    )

    const result = nextReaction
      ? await setNewsReaction(article.id, nextReaction)
      : await clearNewsReaction(article.id)

    if (result.error) {
      setReactionSummary(previousSummary)
      setReactionError(getFriendlyReactionError(result.error))
    } else {
      setReactionSummary(result.data)
    }

    setIsReactionPickerOpen(false)
    setIsSavingReaction(false)
  }

  const cardContent = (
    <>
      {article.image && compact && article.slug && (
        <Link
          to={storyHref}
          className={`media-frame ${compact ? 'h-52' : 'h-60'}`}
        >
          <img
            src={article.image}
            alt={article.imageAlt || ''}
            loading="lazy"
            decoding="async"
            className="media-image"
          />
        </Link>
      )}
      {article.image && (!compact || !article.slug) && (
        <div className={`media-frame ${compact ? 'h-52' : 'h-60'}`}>
          <img
            src={article.image}
            alt={article.imageAlt || ''}
            loading="lazy"
            decoding="async"
            className="media-image"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-extrabold tracking-wide text-brand-600 uppercase">
            {article.category}
          </p>
          {article.isFeatured && (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 uppercase">
              <Star size={12} fill="currentColor" />
              Featured
            </span>
          )}
        </div>
        <h3 className="mt-2 text-2xl font-extrabold text-navy-900">
          {compact && article.slug ? (
            <Link
              to={storyHref}
              className="transition-colors duration-200 group-hover:text-brand-600"
            >
              {article.title}
            </Link>
          ) : (
            article.title
          )}
        </h3>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <CalendarDays size={14} />
          {article.date}
        </p>
        <p
          className={`mt-4 text-sm leading-6 text-slate-600 ${
            compact ? 'line-clamp-3' : ''
          }`}
        >
          {article.summary}
        </p>
        {!compact && article.body && (
          <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-7 text-slate-600">
            {article.body}
          </p>
        )}
        {compact && (
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
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
                      transition={{
                        duration: shouldReduceMotion ? 0.01 : 0.18,
                      }}
                      className="absolute bottom-full left-0 z-30 mb-3 flex gap-1.5 rounded-full border border-slate-200 bg-white p-1.5 shadow-[0_18px_55px_-28px_rgba(15,23,42,0.45)]"
                    >
                      {newsReactionTypes.map(({ id, label }) => {
                        const Icon = reactionIcons[id]
                        const isActive = reactionSummary.userReaction === id

                        return (
                          <Motion.button
                            key={id}
                            type="button"
                            onClick={() => handleReaction(id)}
                            disabled={isSavingReaction}
                            whileHover={
                              shouldReduceMotion
                                ? undefined
                                : { y: -7, scale: 1.12 }
                            }
                            whileTap={
                              shouldReduceMotion ? undefined : { scale: 0.94 }
                            }
                            className={`group/reaction relative grid size-10 place-items-center rounded-full border transition disabled:cursor-wait disabled:opacity-60 ${
                              isActive
                                ? 'border-brand-500 shadow-lg shadow-blue-600/15'
                                : 'shadow-sm'
                            } ${reactionButtonStyles[id]}`}
                            aria-label={`React with ${label}`}
                          >
                            <Icon size={18} aria-hidden="true" />
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

              <button
                type="button"
                onClick={() => setIsReactionPickerOpen((open) => !open)}
                disabled={isSavingReaction}
                title={reactionError || 'React to this story'}
                className={`inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-xs font-extrabold transition disabled:cursor-wait disabled:opacity-70 ${
                  activeReaction
                    ? reactionButtonStyles[activeReaction.id]
                    : 'text-slate-500 hover:text-brand-600'
                }`}
              >
                <ActiveReactionIcon size={14} aria-hidden="true" />
                {reactionTotalLabel}
              </button>
            </div>
            <Link
              to={storyHref}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-600"
            >
              Read full story
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </>
  )

  return (
    <article className="surface-card interactive-card group flex h-full flex-col overflow-hidden">
      {cardContent}
    </article>
  )
}

export default NewsCard
