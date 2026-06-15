import {
  AnimatePresence,
  motion as Motion,
  useReducedMotion,
} from 'framer-motion'
import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import About from './pages/About'
import Account from './pages/Account'
import AdminDashboard from './pages/AdminDashboard'
import AnnouncementDetails from './pages/AnnouncementDetails'
import Announcements from './pages/Announcements'
import Alumni from './pages/Alumni'
import Events from './pages/Events'
import Gallery from './pages/Gallery'
import Home from './pages/Home'
import StudentPortal from './pages/StudentPortal'

function ScrollToRoute() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    let secondFrame
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (hash) {
          document
            .getElementById(hash.slice(1))
            ?.scrollIntoView({ block: 'start' })
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        }
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      if (secondFrame) window.cancelAnimationFrame(secondFrame)
    }
  }, [pathname, hash])

  return null
}

function App() {
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()
  const isAdminRoute = location.pathname === '/admin'

  return (
    <>
      <ScrollToRoute />
      {isAdminRoute ? (
        <Routes location={location}>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
      ) : (
        <>
          <Navbar />
          <AnimatePresence mode="wait">
            <Motion.div
              key={location.pathname}
              initial={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 0, y: 10, filter: 'blur(3px)' }
              }
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 0, y: -5, filter: 'blur(2px)' }
              }
              transition={{
                duration: shouldReduceMotion ? 0.01 : 0.24,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/account" element={<Account />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route
                  path="/announcements/:id"
                  element={<AnnouncementDetails />}
                />
                <Route path="/alumni" element={<Alumni />} />
                <Route path="/events" element={<Events />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/student-portal" element={<StudentPortal />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </Motion.div>
          </AnimatePresence>
          <Footer />
        </>
      )}
    </>
  )
}

export default App
