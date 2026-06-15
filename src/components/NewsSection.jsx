import { motion as Motion } from 'framer-motion'
import { ArrowRight, LoaderCircle, Newspaper } from 'lucide-react'
import { useNews } from '../hooks/useMedia'
import NewsCard from './NewsCard'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

function NewsSection() {
  const { news: organizationNews, isLoading } = useNews(3)

  return (
    <section id="news" className="bg-slate-50/70 py-24 sm:py-32">
      <div className="section-shell">
        <Reveal>
          <SectionHeader
            eyebrow="Stories and highlights"
            title="Organization News"
            description="Official student achievements, partnerships, activities, and community updates will be published here."
            actionLabel="News & gallery"
            actionHref="/gallery"
          />
        </Reveal>

        {isLoading ? (
          <div className="grid min-h-48 place-items-center">
            <LoaderCircle
              size={30}
              className="animate-spin text-brand-600"
              aria-label="Loading organization news"
            />
          </div>
        ) : organizationNews.length === 0 ? (
          <Reveal delay={0.08}>
            <Motion.div
              whileHover={{ y: -3 }}
              className="surface-card border-dashed px-6 py-12 text-center sm:px-10"
            >
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <Newspaper size={28} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-2xl font-black text-navy-900">
                No official news has been published yet
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
                Verified organization stories and activity updates will appear
                here once they are ready for publication.
              </p>
              <a
                href="/gallery"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-brand-500"
              >
                Open news and gallery
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </Motion.div>
          </Reveal>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {organizationNews.map((article, index) => (
              <Reveal key={article.id} delay={index * 0.08}>
                <NewsCard article={article} compact />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default NewsSection
