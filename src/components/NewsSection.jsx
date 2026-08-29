import { useMemo } from 'react'
import { Newspaper } from 'lucide-react'
import { useNews } from '../hooks/useMedia'
import { getRandomRobotAssignments } from '../lib/robotSightings'
import ContentSkeleton from './ContentSkeleton'
import EmptyState from './EmptyState'
import NewsCard from './NewsCard'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

function NewsSection() {
  const { news: organizationNews, isLoading } = useNews(3)
  const robotAssignments = useMemo(
    () => getRandomRobotAssignments(organizationNews.length, ['circuit']),
    [organizationNews.length],
  )

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
          <ContentSkeleton
            count={3}
            media
            label="Loading organization news"
          />
        ) : organizationNews.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="No official news has been published yet"
            description="Verified organization stories and activity updates will appear here once they are ready for publication."
            actionLabel="Open news and gallery"
            actionHref="/gallery"
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {organizationNews.map((article, index) => (
              <Reveal
                key={article.id}
                delay={index * 0.08}
                direction={index % 2 === 0 ? 'left' : 'right'}
              >
                <NewsCard
                  article={article}
                  compact
                  robotVariant={robotAssignments[index]}
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default NewsSection
