import {
  AnimatePresence,
  motion as Motion,
  useReducedMotion,
} from 'framer-motion'
import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
import Footer from './components/Footer'
import Navbar from './components/Navbar'

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
