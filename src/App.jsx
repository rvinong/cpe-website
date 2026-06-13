import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
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
  return (
    <>
      <ScrollToRoute />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/account" element={<Account />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/announcements/:id" element={<AnnouncementDetails />} />
        <Route path="/alumni" element={<Alumni />} />
        <Route path="/events" element={<Events />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/student-portal" element={<StudentPortal />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  )
}

export default App
