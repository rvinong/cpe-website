import { motion as Motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  tone = 'light',
  compact = false,
  className = '',
}) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className={`empty-state ${tone === 'dark' ? 'empty-state-dark' : ''} ${
        compact ? 'empty-state-compact' : ''
      } ${className}`}
    >
      <span className="empty-state-icon">
        <Icon size={compact ? 24 : 28} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {actionLabel && actionHref && (
        <Link to={actionHref} className="primary-button motion-button mt-6">
          {actionLabel}
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      )}
    </Motion.div>
  )
}

export default EmptyState
