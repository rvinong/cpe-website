import AlumniSection from '../components/AlumniSection'
import AnnouncementsSection from '../components/AnnouncementsSection'
import FeaturedPrograms from '../components/FeaturedPrograms'
import Footer from '../components/Footer'
import GlanceSection from '../components/GlanceSection'
import Hero from '../components/Hero'
import Navbar from '../components/Navbar'
import NewsSection from '../components/NewsSection'
import QuickAccess from '../components/QuickAccess'
import StatsStrip from '../components/StatsStrip'
import UpcomingEvents from '../components/UpcomingEvents'

function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AnnouncementsSection />
        <QuickAccess />
        <GlanceSection />
        <UpcomingEvents />
        <FeaturedPrograms />
        <AlumniSection />
        <NewsSection />
        <StatsStrip />
      </main>
      <Footer />
    </>
  )
}

export default Home
