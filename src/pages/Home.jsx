import AlumniSection from '../components/AlumniSection'
import FeaturedPrograms from '../components/FeaturedPrograms'
import GlanceSection from '../components/GlanceSection'
import Hero from '../components/Hero'
import NewsSection from '../components/NewsSection'
import QuickAccess from '../components/QuickAccess'
import TransparencySnapshot from '../components/TransparencySnapshot'
import UpcomingEvents from '../components/UpcomingEvents'

function Home() {
  return (
    <main>
      <Hero />
      <NewsSection />
      <QuickAccess />
      <UpcomingEvents />
      <TransparencySnapshot />
      <FeaturedPrograms />
      <GlanceSection />
      <AlumniSection />
    </main>
  )
}

export default Home
