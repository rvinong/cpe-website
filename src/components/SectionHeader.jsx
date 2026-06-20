import { ArrowRight } from 'lucide-react'

function SectionHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref = '#',
  centered = false,
  light = false,
}) {
  return (
    <div
      className={`mb-9 flex gap-6 sm:mb-12 ${
        centered
          ? 'mx-auto max-w-2xl flex-col items-center text-center'
          : 'items-end justify-between'
      }`}
    >
      <div className={centered ? '' : 'max-w-2xl'}>
        {eyebrow && (
          <p
            className={`mb-4 text-[11px] font-extrabold tracking-[0.22em] uppercase ${
              light ? 'text-blue-200' : 'text-brand-600'
            }`}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={`text-3xl font-black tracking-[-0.05em] sm:text-5xl sm:tracking-[-0.055em] ${
            light ? 'text-white' : 'text-navy-900'
          }`}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`mt-5 text-base leading-7 ${
              light ? 'text-blue-100/80' : 'text-slate-600'
            }`}
          >
            {description}
          </p>
        )}
      </div>
      {actionLabel && (
        <a
          href={actionHref}
          className={`motion-button hidden shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition sm:flex ${
            light
              ? 'border border-white/15 bg-white/10 text-white hover:bg-white/15'
              : 'border border-blue-100 bg-brand-50 text-brand-600 hover:border-brand-500 hover:bg-brand-600 hover:text-white'
          }`}
        >
          {actionLabel}
          <ArrowRight size={17} aria-hidden="true" />
        </a>
      )}
    </div>
  )
}

export default SectionHeader
