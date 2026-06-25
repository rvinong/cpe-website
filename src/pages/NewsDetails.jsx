import {
  AnimatePresence,
  motion as Motion,
  useReducedMotion,
} from 'framer-motion'
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Heart,
  Image as ImageIcon,
  LogIn,
  Newspaper,
  PartyPopper,
  SmilePlus,
  Star,
  ThumbsUp,
  UsersRound,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import ContentSkeleton from '../components/ContentSkeleton'
import useAuth from '../context/useAuth'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useNewsPost } from '../hooks/useMedia'
import {
  clearNewsReaction,
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

const reactionStyles = {
  like: 'text-brand-600 bg-brand-50 ring-blue-100',
  love: 'text-rose-600 bg-rose-50 ring-rose-100',
  celebrate: 'text-amber-600 bg-amber-50 ring-amber-100',
  wow: 'text-violet-600 bg-violet-50 ring-violet-100',
  support: 'text-emerald-600 bg-emerald-50 ring-emerald-100',
}

function getBodyParagraphs(body) {
  return String(body || '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
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

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)

  return {
    counts,
    total,
    userReaction: nextReaction,
  }
}

function NewsDetails() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()
  const { user } = useAuth()
  const { newsPost, isLoading, setNewsPost } = useNewsPost(slug)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [navigationDirection, setNavigationDirection] = useState(1)
  const [reactionOverride, setReactionOverride] = useState(null)
  const [isSavingReaction, setIsSavingReaction] = useState(false)
  const [reactionError, setReactionError] = useState('')
  const [membersReaction, setMembersReaction] = useState('')
  const [reactionMembers, setReactionMembers] = useState([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [memberError, setMemberError] = useState('')
  const images = useMemo(
    () => newsPost?.images?.filter((image) => image.image) ?? [],
    [newsPost],
  )
  const bodyParagraphs = useMemo(
    () => getBodyParagraphs(newsPost?.body),
    [newsPost?.body],
  )
  const safeActiveImageIndex =
    images.length === 0 ? 0 : Math.min(activeImageIndex, images.length - 1)
  const activeImage = images[safeActiveImageIndex]
  const reactionSummary =
    reactionOverride?.slug === slug
      ? reactionOverride.summary
      : newsPost?.reactions || null

  useBodyScrollLock(Boolean(membersReaction))

  const showPreviousImage = useCallback(() => {
    setNavigationDirection(-1)
    setActiveImageIndex((current) => {
      if (images.length < 2) return 0
      const safeIndex = Math.min(current, images.length - 1)
      return safeIndex === 0 ? images.length - 1 : safeIndex - 1
    })
  }, [images.length])

  const showNextImage = useCallback(() => {
    setNavigationDirection(1)
    setActiveImageIndex((current) => {
      if (images.length < 2) return 0
      const safeIndex = Math.min(current, images.length - 1)
      return safeIndex === images.length - 1 ? 0 : safeIndex + 1
    })
  }, [images.length])

  useEffect(() => {
    if (images.length < 2) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') showPreviousImage()
      if (event.key === 'ArrowRight') showNextImage()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [images.length, showNextImage, showPreviousImage])

  const loginRedirect = () => {
    navigate(
      `/account?mode=login&redirect=${encodeURIComponent(location.pathname)}`,
    )
  }

  const updateReactionState = (summary) => {
    setReactionOverride({ slug, summary })
    setNewsPost((current) =>
      current
        ? {
            ...current,
            reactions: summary,
            reactionTotal: summary.total,
          }
        : current,
    )
  }

  const handleReaction = async (reactionType) => {
    if (!newsPost || !reactionSummary) return
    if (!user) {
      loginRedirect()
      return
    }

    setIsSavingReaction(true)
    setReactionError('')

    const previousSummary = reactionSummary
    const nextReaction =
      previousSummary.userReaction === reactionType ? '' : reactionType
    updateReactionState(
      getOptimisticReactionSummary(previousSummary, nextReaction),
    )

    const result = nextReaction
      ? await setNewsReaction(newsPost.id, nextReaction)
      : await clearNewsReaction(newsPost.id)

    if (result.error) {
      updateReactionState(previousSummary)
      setReactionError(result.error.message)
    } else {
      updateReactionState(result.data)
    }

    setIsSavingReaction(false)
  }

  const openReactionMembers = async (reactionType) => {
    if (!newsPost) return
    if (!user) {
      loginRedirect()
      return
    }

    setMembersReaction(reactionType)
    setReactionMembers([])
    setMemberError('')
    setIsLoadingMembers(true)

    const { data, error } = await getNewsReactionMembers(
      newsPost.id,
      reactionType,
    )

    setReactionMembers(error ? [] : data || [])
    setMemberError(error?.message || '')
    setIsLoadingMembers(false)
  }

  if (isLoading && !newsPost) {
    return (
      <main className="min-h-[70vh] bg-slate-50 pb-24 pt-[124px] sm:pt-[140px]">
        <div className="section-shell">
          <ContentSkeleton
            variant="detail"
            className="mx-auto max-w-4xl"
            label="Loading news story"
          />
        </div>
      </main>
    )
  }

  if (!newsPost) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-slate-50 px-4 pb-20 pt-36">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_26px_70px_-42px_rgba(15,23,42,0.45)] sm:p-12"
        >
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Newspaper size={28} aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-3xl font-black tracking-tight text-navy-900">
            News story not found
          </h1>
          <p className="mt-3 text-slate-600">
            The story may have been moved or is no longer available.
          </p>
          <Link to="/gallery" className="primary-button mt-7">
            <ArrowLeft size={17} aria-hidden="true" />
            Back to News & Gallery
          </Link>
        </Motion.div>
      </main>
    )
  }

  const selectedReaction = membersReaction
    ? newsReactionTypes.find((reaction) => reaction.id === membersReaction)
    : null

  return (
    <>
      <main className="bg-slate-50 pb-24 pt-[120px] sm:pb-28 sm:pt-[136px]">
        <div className="section-shell">
          <Motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-5xl"
          >
            <Link to="/gallery#news" className="secondary-button">
              <ArrowLeft size={17} aria-hidden="true" />
              Back to News & Gallery
            </Link>

            <article className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_-48px_rgba(15,23,42,0.5)]">
              <div className="relative isolate overflow-hidden border-b border-blue-100 bg-gradient-to-br from-brand-50 via-white to-blue-100/60 px-6 py-12 sm:px-10 lg:px-14">
                <div className="subtle-grid absolute inset-0 -z-10 opacity-60" />
                <span className="grid size-16 place-items-center rounded-2xl bg-white text-brand-600 shadow-lg shadow-blue-600/10 ring-1 ring-blue-100">
                  <Newspaper size={29} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <div className="mt-7 flex flex-wrap items-center gap-3 text-xs font-bold">
                  <span className="rounded-full bg-brand-600 px-3 py-1.5 text-white">
                    {newsPost.category}
                  </span>
                  {newsPost.isFeatured && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-amber-700">
                      <Star size={14} fill="currentColor" aria-hidden="true" />
                      Featured story
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <CalendarDays size={15} aria-hidden="true" />
                    Published: {newsPost.date}
                  </span>
                </div>
                <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] text-navy-900 sm:text-5xl sm:tracking-[-0.045em]">
                  {newsPost.title}
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                  {newsPost.summary}
                </p>
              </div>

              <div className="px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
                {images.length > 0 && (
                  <section aria-label="News story images">
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-navy-950">
                      <AnimatePresence
                        mode="wait"
                        initial={false}
                        custom={navigationDirection}
                      >
                        <Motion.figure
                          key={activeImage.id || activeImage.imagePath}
                          custom={navigationDirection}
                          initial={(direction) =>
                            shouldReduceMotion
                              ? { opacity: 1 }
                              : { opacity: 0, x: direction * 42, scale: 0.985 }
                          }
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={(direction) =>
                            shouldReduceMotion
                              ? { opacity: 1 }
                              : {
                                  opacity: 0,
                                  x: direction * -42,
                                  scale: 0.985,
                                }
                          }
                          transition={{
                            duration: shouldReduceMotion ? 0.01 : 0.24,
                          }}
                          drag={images.length > 1 ? 'x' : false}
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={shouldReduceMotion ? 0 : 0.14}
                          onDragEnd={(_, info) => {
                            if (
                              Math.abs(info.offset.x) < 70 &&
                              Math.abs(info.velocity.x) < 500
                            ) {
                              return
                            }

                            if (info.offset.x > 0) showPreviousImage()
                            else showNextImage()
                          }}
                          className="cursor-grab touch-pan-y active:cursor-grabbing"
                        >
                          <img
                            src={activeImage.image}
                            alt={activeImage.altText}
                            draggable="false"
                            className="max-h-[620px] w-full select-none object-contain"
                          />
                          {(activeImage.caption || images.length > 1) && (
                            <figcaption className="border-t border-white/10 bg-navy-950/95 px-5 py-4 text-sm text-slate-200">
                              {activeImage.caption || newsPost.title}
                            </figcaption>
                          )}
                        </Motion.figure>
                      </AnimatePresence>

                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={showPreviousImage}
                            className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                            aria-label="Previous image"
                          >
                            <ChevronLeft size={24} />
                          </button>
                          <button
                            type="button"
                            onClick={showNextImage}
                            className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                            aria-label="Next image"
                          >
                            <ChevronRight size={24} />
                          </button>
                        </>
                      )}
                    </div>

                    {images.length > 1 && (
                      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                        {images.map((image, index) => (
                          <button
                            key={image.id || image.imagePath}
                            type="button"
                            onClick={() => {
                              setNavigationDirection(
                                index > activeImageIndex ? 1 : -1,
                              )
                              setActiveImageIndex(index)
                            }}
                            className={`h-20 w-24 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                              activeImageIndex === index
                                ? 'border-brand-600 shadow-lg shadow-blue-600/15'
                                : 'border-slate-200 opacity-75 hover:opacity-100'
                            }`}
                            aria-label={`View image ${index + 1}`}
                          >
                            <img
                              src={image.image}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="size-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {images.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-blue-200 bg-brand-50/35 p-8 text-center">
                    <ImageIcon
                      size={30}
                      className="mx-auto text-brand-600"
                      aria-hidden="true"
                    />
                    <p className="mt-3 text-sm font-bold text-slate-600">
                      No images were attached to this story.
                    </p>
                  </div>
                )}

                <div className="mt-10 space-y-6 text-base leading-8 text-slate-700">
                  {bodyParagraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                {reactionSummary && (
                  <section className="mt-12 rounded-3xl border border-blue-100 bg-brand-50/35 p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                          Community reactions
                        </p>
                        <h2 className="mt-1 text-2xl font-black text-navy-900">
                          React to this story
                        </h2>
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500">
                        <UsersRound size={17} aria-hidden="true" />
                        {reactionSummary.total} total
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-5">
                      {newsReactionTypes.map(({ id, label }) => {
                        const Icon = reactionIcons[id]
                        const isActive = reactionSummary.userReaction === id
                        const count = reactionSummary.counts[id] || 0

                        return (
                          <div key={id} className="grid gap-2">
                            <button
                              type="button"
                              onClick={() => handleReaction(id)}
                              disabled={isSavingReaction}
                              className={`rounded-2xl border px-3 py-4 text-center transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 ${
                                isActive
                                  ? 'border-brand-500 bg-white shadow-lg shadow-blue-600/10'
                                  : 'border-slate-200 bg-white hover:border-brand-300'
                              }`}
                            >
                              <span
                                className={`mx-auto grid size-11 place-items-center rounded-xl ring-1 ${reactionStyles[id]}`}
                              >
                                <Icon size={20} aria-hidden="true" />
                              </span>
                              <span className="mt-3 block text-sm font-extrabold text-navy-900">
                                {label}
                              </span>
                              <span className="mt-1 block text-xs font-bold text-slate-500">
                                {count}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openReactionMembers(id)}
                              disabled={count === 0}
                              className="text-xs font-bold text-slate-500 transition hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              View members
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    {!user && (
                      <button
                        type="button"
                        onClick={loginRedirect}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-brand-600"
                      >
                        <LogIn size={17} aria-hidden="true" />
                        Sign in to react
                      </button>
                    )}

                    {reactionError && (
                      <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {reactionError}
                      </p>
                    )}
                  </section>
                )}

                <div className="mt-10 border-t border-slate-100 pt-8">
                  <Link to="/gallery#news" className="primary-button">
                    <ArrowLeft size={17} aria-hidden="true" />
                    Back to News & Gallery
                  </Link>
                </div>
              </div>
            </article>
          </Motion.div>
        </div>
      </main>

      <AnimatePresence>
        {membersReaction && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-navy-950/75 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedReaction?.label || 'Reaction'} members`}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setMembersReaction('')
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
                    Reaction members
                  </p>
                  <h2 className="mt-1 text-xl font-black text-navy-900">
                    {selectedReaction?.label || 'Reaction'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMembersReaction('')}
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
                ) : reactionMembers.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-blue-200 bg-brand-50/35 p-4 text-sm leading-6 text-slate-600">
                    No approved member names are available for this reaction
                    yet.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {reactionMembers.map((member) => (
                      <div
                        key={`${member.profile_id}-${member.reacted_at}`}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-sm font-black text-white">
                          {member.full_name.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-extrabold text-navy-900">
                            {member.full_name}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            {selectedReaction?.label}
                          </span>
                        </span>
                      </div>
                    ))}
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

export default NewsDetails
