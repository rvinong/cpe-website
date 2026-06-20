import {
  AnimatePresence,
  motion as Motion,
} from 'framer-motion'
import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import { useMotionPreferences } from './hooks/useMotionPreferences'
import { getRouteMotion } from './lib/motion'

const About = lazy(() => import('./pages/About'))
const Account = lazy(() => import('./pages/Account'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AnnouncementDetails = lazy(() => import('./pages/AnnouncementDetails'))
const Announcements = lazy(() => import('./pages/Announcements'))
const Alumni = lazy(() => import('./pages/Alumni'))
const Events = lazy(() => import('./pages/Events'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Home = lazy(() => import('./pages/Home'))
const StudentPortal = lazy(() => import('./pages/StudentPortal'))

function RouteLoading({ admin = false }) {
  return (
    <main
      className={`grid place-items-center px-5 ${
        admin ? 'min-h-screen bg-slate-50' : 'min-h-[72vh] pt-28'
      }`}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.45)] sm:p-9">
        <div className="flex items-center gap-4">
          <span className="size-12 animate-pulse rounded-2xl bg-brand-100" />
          <div className="flex-1 space-y-2.5">
            <span className="block h-3 w-28 animate-pulse rounded-full bg-brand-100" />
            <span className="block h-5 w-3/4 animate-pulse rounded-full bg-slate-200" />
          </div>
        </div>
        <div className="mt-7 space-y-3">
          <span className="block h-3 w-full animate-pulse rounded-full bg-slate-100" />
          <span className="block h-3 w-5/6 animate-pulse rounded-full bg-slate-100" />
          <span className="block h-3 w-2/3 animate-pulse rounded-full bg-slate-100" />
        </div>
        <span className="sr-only">Loading page content</span>
      </div>
    </main>
  )
}

function ScrollToRoute() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    let animationFrame
    let attempts = 0
    let stableFrames = 0

    const scrollToRoute = () => {
      if (!hash) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        return
      }

      const target = document.getElementById(hash.slice(1))
      attempts += 1

      if (!target) {
        if (attempts < 120) {
          animationFrame = window.requestAnimationFrame(scrollToRoute)
        }
        return
      }

      const scrollPadding =
        Number.parseFloat(
          window.getComputedStyle(document.documentElement).scrollPaddingTop,
        ) || 0
      const distanceFromTarget =
        target.getBoundingClientRect().top - scrollPadding

      if (Math.abs(distanceFromTarget) > 1) {
        const root = document.documentElement
        const previousScrollBehavior = root.style.scrollBehavior
        root.style.scrollBehavior = 'auto'
        window.scrollTo({
          top: window.scrollY + distanceFromTarget,
          left: 0,
          behavior: 'auto',
        })
        root.style.scrollBehavior = previousScrollBehavior
        stableFrames = 0
      } else {
        stableFrames += 1
      }

      if (attempts < 120 && stableFrames < 12) {
        animationFrame = window.requestAnimationFrame(scrollToRoute)
      }
    }

    animationFrame = window.requestAnimationFrame(scrollToRoute)

    return () => {
      window.cancelAnimationFrame(animationFrame)
    }
  }, [pathname, hash])

  return null
}

function App() {
  const location = useLocation()
  const { isCompactMotion, shouldReduceMotion } = useMotionPreferences()
  const routeMotion = getRouteMotion(isCompactMotion, shouldReduceMotion)
  const isAdminRoute = location.pathname === '/admin'

  return (
    <>
      <ScrollToRoute />
      {isAdminRoute ? (
        <Suspense fallback={<RouteLoading admin />}>
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
        </Suspense>
      ) : (
        <>
          <Navbar />
          <AnimatePresence mode="wait">
            <Motion.div
              key={location.pathname}
              initial={routeMotion.initial}
              animate={routeMotion.animate}
              exit={routeMotion.exit}
              transition={routeMotion.transition}
            >
              <Suspense fallback={<RouteLoading />}>
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
              </Suspense>
            </Motion.div>
          </AnimatePresence>
          <Footer />
        </>
      )}
    </>
  )
}

export default App
