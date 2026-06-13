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
      className={`mb-10 flex gap-6 ${
        centered
          ? 'mx-auto max-w-2xl flex-col items-center text-center'
          : 'items-end justify-between'
      }`}
    >
      <div className={centered ? '' : 'max-w-2xl'}>
        {eyebrow && (
          <p
            className={`mb-3 text-xs font-extrabold tracking-[0.22em] uppercase ${
              light ? 'text-blue-200' : 'text-brand-600'
            }`}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={`text-3xl font-black tracking-[-0.035em] sm:text-4xl ${
            light ? 'text-white' : 'text-navy-900'
          }`}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`mt-4 text-base leading-7 ${
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
          className={`hidden shrink-0 items-center gap-2 text-sm font-bold transition-colors sm:flex ${
            light
              ? 'text-white hover:text-blue-200'
              : 'text-brand-600 hover:text-brand-700'
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
