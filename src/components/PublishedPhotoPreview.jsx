import {
  CalendarDays,
  Clock3,
  Images,
  MapPin,
  Newspaper,
  Star,
  UserRound,
} from 'lucide-react'

const previewTypes = {
  news: {
    label: 'news story',
    icon: Newspaper,
  },
  gallery: {
    label: 'gallery album',
    icon: Images,
  },
  event: {
    label: 'event',
    icon: CalendarDays,
  },
  profile: {
    label: 'profile',
    icon: UserRound,
  },
}

function formatPreviewDate(value, emptyLabel = 'Date will be assigned on publish') {
  if (!value) return emptyLabel

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return emptyLabel

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function getInitials(name) {
  const initials = String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return initials || 'PR'
}

function PreviewImage({ image, alt, className }) {
  if (image) {
    return <img src={image} alt={alt} className={className} />
  }

  return (
    <div className="published-photo-preview-placeholder">
      <span className="published-photo-preview-placeholder-icon">
        <Images size={22} aria-hidden="true" />
      </span>
      <span>No photo selected</span>
    </div>
  )
}

function PublishedPhotoPreview({
  kind = 'news',
  image = '',
  imageCount = 0,
  title = '',
  category = '',
  date = '',
  summary = '',
  description = '',
  venue = '',
  time = '',
  name = '',
  role = '',
  organization = '',
  batch = '',
  academicYear = '',
  profileLabel = '',
  status = '',
  isFeatured = false,
}) {
  const previewType = previewTypes[kind] || previewTypes.news
  const PreviewIcon = previewType.icon
  const isProfile = kind === 'profile'
  const titleValue = String(title || '').trim()
  const summaryValue = String(summary || '').trim()
  const descriptionValue = String(description || '').trim()
  const displayTitle = titleValue || `${previewType.label} title`
  const displayName = String(name || '').trim() || 'Profile name'

  return (
    <section className={`published-photo-preview published-photo-preview-${kind}`}>
      <div className="published-photo-preview-heading">
        <div>
          <p className="published-photo-preview-kicker">Published preview</p>
          <p className="published-photo-preview-help">
            See how this {previewType.label} will appear after saving.
          </p>
        </div>
        <span className="published-photo-preview-badge">
          <PreviewIcon size={14} aria-hidden="true" />
          Live layout
        </span>
      </div>

      {isProfile ? (
        <article className="published-photo-preview-profile-card">
          <div className="published-photo-preview-profile-image">
            {image ? (
              <img src={image} alt="" />
            ) : (
              <span>{getInitials(displayName)}</span>
            )}
          </div>
          <div className="published-photo-preview-profile-copy">
            <span className="published-photo-preview-category">
              {profileLabel || 'Verified profile'}
            </span>
            <h4>{displayName}</h4>
            {(role || organization) && (
              <p>
                {[role, organization].filter(Boolean).join(' at ')}
              </p>
            )}
            {(batch || academicYear) && (
              <span className="published-photo-preview-meta">
                {batch ? `Batch ${batch}` : academicYear}
              </span>
            )}
          </div>
        </article>
      ) : (
        <article className="published-photo-preview-card">
          <div className="published-photo-preview-media">
            <PreviewImage image={image} alt="" className="published-photo-preview-image" />
            {imageCount > 1 && (
              <span className="published-photo-preview-image-count">
                {imageCount} photos
              </span>
            )}
          </div>

          <div className="published-photo-preview-body">
            <div className="published-photo-preview-tags">
              <span className="published-photo-preview-category">
                {category || previewType.label}
              </span>
              {status && kind === 'event' && (
                <span className="published-photo-preview-status">{status}</span>
              )}
              {isFeatured && (
                <span className="published-photo-preview-featured">
                  <Star size={12} fill="currentColor" aria-hidden="true" />
                  Featured
                </span>
              )}
            </div>

            <h4>{displayTitle}</h4>

            {kind === 'event' ? (
              <div className="published-photo-preview-details">
                <span>
                  <CalendarDays size={14} aria-hidden="true" />
                  {formatPreviewDate(date)}
                </span>
                {time && (
                  <span>
                    <Clock3 size={14} aria-hidden="true" />
                    {time}
                  </span>
                )}
                {venue && (
                  <span>
                    <MapPin size={14} aria-hidden="true" />
                    {venue}
                  </span>
                )}
              </div>
            ) : (
              <span className="published-photo-preview-date">
                <CalendarDays size={14} aria-hidden="true" />
                {formatPreviewDate(date)}
              </span>
            )}

            <p className="published-photo-preview-summary">
              {summaryValue || descriptionValue || 'Add a short description to preview it here.'}
            </p>

            {kind === 'gallery' && descriptionValue && (
              <p className="published-photo-preview-description">
                {descriptionValue}
              </p>
            )}

            {kind === 'news' && (
              <div className="published-photo-preview-footer">
                <span>Reactions and comments appear here</span>
                <span>Read full story</span>
              </div>
            )}
          </div>
        </article>
      )}
    </section>
  )
}

export default PublishedPhotoPreview
