import { ArrowRight, CalendarDays, Star, ThumbsUp } from 'lucide-react'
import { Link } from 'react-router-dom'

function NewsCard({ article, compact = false }) {
  const cardContent = (
    <>
      {article.image && (
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
        <h3 className="mt-2 text-2xl font-extrabold text-navy-900 transition-colors duration-200 group-hover:text-brand-600">
          {article.title}
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
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500">
              <ThumbsUp size={14} aria-hidden="true" />
              {article.reactionTotal || 0} reactions
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-600">
              Read full story
              <ArrowRight size={14} aria-hidden="true" />
            </span>
          </div>
        )}
      </div>
    </>
  )

  return (
    <article className="surface-card interactive-card group flex h-full flex-col overflow-hidden">
      {compact && article.slug ? (
        <Link
          to={`/gallery/news/${article.slug}`}
          className="flex h-full flex-1 flex-col focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
        >
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </article>
  )
}

export default NewsCard
