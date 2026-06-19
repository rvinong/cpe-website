import AlumniSection from '../components/AlumniSection'
import FeaturedPrograms from '../components/FeaturedPrograms'
import GlanceSection from '../components/GlanceSection'
import Hero from '../components/Hero'
import NewsSection from '../components/NewsSection'
import QuickAccess from '../components/QuickAccess'
import StatsStrip from '../components/StatsStrip'
import UpcomingEvents from '../components/UpcomingEvents'

function Home() {
  return (
    <main>
      <Hero />
      <QuickAccess />
      <GlanceSection />
      <UpcomingEvents />
      <FeaturedPrograms />
      <AlumniSection />
      <NewsSection />
      <StatsStrip />
    </main>
  )
}

export default Home
