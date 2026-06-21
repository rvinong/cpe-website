function AdminListSkeleton({
  rows = 3,
  withMedia = false,
  label = 'Loading records',
}) {
  return (
    <div
      className="admin-list-skeleton divide-y divide-slate-200"
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className={`grid gap-4 px-5 py-5 sm:px-6 ${
            withMedia
              ? 'sm:grid-cols-[4rem_1fr_auto] sm:items-center'
              : 'sm:grid-cols-[1fr_auto] sm:items-center'
          }`}
        >
          {withMedia && (
            <span className="skeleton-block block size-16 rounded-2xl" />
          )}
          <div className="min-w-0 space-y-3">
            <span className="skeleton-block block h-3 w-24 rounded-full" />
            <span className="skeleton-block block h-5 w-2/3 rounded-lg" />
            <span className="skeleton-block block h-3.5 w-5/6 rounded-full" />
          </div>
          <span className="skeleton-block hidden h-10 w-24 rounded-xl sm:block" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}

export default AdminListSkeleton
