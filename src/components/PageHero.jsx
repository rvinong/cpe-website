import { motion as Motion } from 'framer-motion'

function PageHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  accentIcon: AccentIcon,
  actions,
}) {
  return (
    <section className="page-hero">
      <div className="page-hero-grid" />
      <div className="page-hero-glow page-hero-glow-primary" />
      <div className="page-hero-glow page-hero-glow-accent" />

      <div className="section-shell relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
        <Motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="page-title">{title}</h1>
          <p className="page-description">{description}</p>
          {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
        </Motion.div>

        {Icon && (
          <Motion.div
            initial={{ opacity: 0, scale: 0.88, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="page-hero-mark"
            aria-hidden="true"
          >
            <span className="page-hero-mark-ring" />
            <Icon size={66} strokeWidth={1.35} />
            {AccentIcon && (
              <AccentIcon
                size={25}
                className="absolute right-7 top-7 text-orange-500"
              />
            )}
          </Motion.div>
        )}
      </div>
    </section>
  )
}

export default PageHero
