const columnClasses = {
  1: 'grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 xl:grid-cols-3',
  4: 'sm:grid-cols-2 xl:grid-cols-4',
}

function ContentSkeleton({
  count = 3,
  columns = 3,
  media = false,
  variant = 'card',
  tone = 'light',
  className = '',
  label = 'Loading content',
}) {
  if (variant === 'detail') {
    return (
      <div
        className={`content-skeleton content-skeleton-detail ${className}`}
        role="status"
        aria-label={label}
        aria-busy="true"
      >
        <div className="skeleton-card overflow-hidden">
          <div className="space-y-5 border-b border-slate-100 p-7 sm:p-10">
            <span className="skeleton-block size-14 rounded-2xl" />
            <span className="skeleton-block h-3 w-32 rounded-full" />
            <span className="skeleton-block h-9 w-5/6 rounded-xl" />
            <span className="skeleton-block h-5 w-2/3 rounded-lg" />
          </div>
          <div className="space-y-4 p-7 sm:p-10">
            <span className="skeleton-block h-4 w-full rounded-full" />
            <span className="skeleton-block h-4 w-11/12 rounded-full" />
            <span className="skeleton-block h-4 w-4/5 rounded-full" />
          </div>
        </div>
        <span className="sr-only">{label}</span>
      </div>
    )
  }

  return (
    <div
      className={`content-skeleton grid gap-5 ${columnClasses[columns] || columnClasses[3]} ${
        tone === 'dark' ? 'content-skeleton-dark' : ''
      } ${className}`}
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card overflow-hidden" key={index}>
          {media && <span className="skeleton-block block aspect-[16/10]" />}
          <div className="space-y-4 p-6">
            <span className="skeleton-block block h-3 w-24 rounded-full" />
            <span className="skeleton-block block h-6 w-4/5 rounded-lg" />
            <div className="space-y-2.5 pt-1">
              <span className="skeleton-block block h-3.5 w-full rounded-full" />
              <span className="skeleton-block block h-3.5 w-5/6 rounded-full" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}

export default ContentSkeleton
