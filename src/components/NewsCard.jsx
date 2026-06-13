import { CalendarDays, Star } from 'lucide-react'

function NewsCard({ article, compact = false }) {
  return (
    <article className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_-40px_rgba(15,23,42,0.4)]">
      {article.image && (
        <img
          src={article.image}
          alt={article.imageAlt || ''}
          className={`${compact ? 'h-52' : 'h-60'} w-full object-cover`}
        />
      )}
      <div className="p-6 sm:p-7">
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
          {article.title}
        </h3>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <CalendarDays size={14} />
          {article.date}
        </p>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {article.summary}
        </p>
        {!compact && article.body && (
          <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-7 text-slate-600">
            {article.body}
          </p>
        )}
      </div>
    </article>
  )
}

export default NewsCard
