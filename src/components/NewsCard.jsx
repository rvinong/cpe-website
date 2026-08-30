import { ArrowRight, CalendarDays, MessageCircle, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import NewsReactionSummary from './NewsReactionSummary'

function pluralizeComment(count) {
  return `${count} ${count === 1 ? 'comment' : 'comments'}`
}

function NewsCard({ article, compact = false }) {
  const storyHref = `/gallery/news/${article.slug}`
  const initialReactionSummary = article.reactions || {
    total: Number(article.reactionTotal) || 0,
  }

  const cardContent = (
    <>
      {(article.cardImage || article.image) && compact && article.slug && (
        <Link
          to={storyHref}
          className="media-frame news-card-media"
        >
          <img
            src={article.cardImage || article.image}
            alt={article.imageAlt || ''}
            loading="lazy"
            decoding="async"
            className="media-image"
          />
        </Link>
      )}
      {(article.cardImage || article.image) && (!compact || !article.slug) && (
        <div className="media-frame news-card-media">
          <img
            src={article.cardImage || article.image}
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
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <NewsReactionSummary
                initialSummary={initialReactionSummary}
                newsPostId={article.id}
              />
              <Link
                to={`${storyHref}#comments`}
                className="inline-flex min-h-9 items-center gap-2 rounded-full px-1.5 py-1 text-xs font-extrabold text-slate-500 transition hover:text-brand-600"
                title="View comments"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-400">
                  <MessageCircle size={12} aria-hidden="true" />
                </span>
                {pluralizeComment(Number(article.commentTotal) || 0)}
              </Link>
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
    <div className="h-full">
      <article className="surface-card interactive-card group relative flex h-full flex-col overflow-hidden">
        {cardContent}
      </article>
    </div>
  )
}

export default NewsCard
