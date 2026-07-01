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
  Image as ImageIcon,
  Newspaper,
  Star,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import ContentSkeleton from '../components/ContentSkeleton'
import NewsComments from '../components/NewsComments'
import { useNewsPost } from '../hooks/useMedia'

function getBodyParagraphs(body) {
  return String(body || '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function NewsDetails() {
  const { slug } = useParams()
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()
  const { newsPost, isLoading, setNewsPost } = useNewsPost(slug)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [navigationDirection, setNavigationDirection] = useState(1)
  const [reactionOverride, setReactionOverride] = useState(null)
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

  useEffect(() => {
    if (!newsPost || location.hash !== '#comments') return undefined

    const scrollTimer = window.setTimeout(() => {
      document.getElementById('comments')?.scrollIntoView({
        block: 'start',
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      })
    }, 80)

    return () => window.clearTimeout(scrollTimer)
  }, [location.hash, newsPost, shouldReduceMotion])

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

  const updateCommentTotal = (commentTotal) => {
    setNewsPost((current) =>
      current
        ? {
            ...current,
            commentTotal,
          }
        : current,
    )
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
              <div className="relative isolate overflow-hidden border-b border-blue-200 bg-gradient-to-br from-brand-50 to-white px-6 py-12 sm:px-10 lg:px-14">
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
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white">
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
                          className="grid cursor-grab place-items-center touch-pan-y active:cursor-grabbing"
                        >
                          <img
                            src={activeImage.image}
                            alt={activeImage.altText}
                            draggable="false"
                            className="max-h-[620px] w-auto max-w-full select-none rounded-3xl object-contain"
                          />
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

                <NewsComments
                  key={`${newsPost.id}-comments`}
                  className="mt-10"
                  initialCommentTotal={newsPost.commentTotal}
                  initialReactionSummary={reactionSummary}
                  newsPostId={newsPost.id}
                  onCommentTotalChange={updateCommentTotal}
                  onReactionSummaryChange={updateReactionState}
                />

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

    </>
  )
}

export default NewsDetails
