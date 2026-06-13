import { AlertTriangle, Database, LoaderCircle, LockKeyhole } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../context/useAuth'

function StatusScreen({ icon: Icon, eyebrow, title, description, action }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-[0_28px_80px_-48px_rgba(15,23,42,0.5)] sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Icon size={28} aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-black text-navy-900">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p>
        {action}
      </div>
    </main>
  )
}

function AdminRoute({ children }) {
  const location = useLocation()
  const {
    user,
    profile,
    profileError,
    isLoading,
    isConfigured,
    canAccessAdmin,
  } = useAuth()

  if (!isConfigured) {
    return (
      <StatusScreen
        icon={Database}
        eyebrow="Backend setup required"
        title="Connect Supabase to open the dashboard"
        description="Create the Supabase project, run the supplied schema, and add the project URL and publishable key to .env.local. The public website remains available while setup is incomplete."
        action={
          <a
            href="/"
            className="mt-7 inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-brand-700"
          >
            Return to website
          </a>
        }
      />
    )
  }

  if (isLoading) {
    return (
      <StatusScreen
        icon={LoaderCircle}
        eyebrow="Checking access"
        title="Loading your administrator session"
        description="The dashboard is verifying your account and organization role."
      />
    )
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname)
    return <Navigate to={`/account?redirect=${redirect}`} replace />
  }

  if (!canAccessAdmin) {
    return (
      <StatusScreen
        icon={profileError ? AlertTriangle : LockKeyhole}
        eyebrow="Restricted area"
        title="Administrator access required"
        description={
          profileError
            ? `Your account is signed in, but the profile role could not be verified: ${profileError}`
            : `This account is assigned the ${profile?.role || 'student'} role. An existing administrator must grant an editor or admin role before this dashboard can be opened.`
        }
        action={
          <a
            href="/account"
            className="mt-7 inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-brand-700"
          >
            View account
          </a>
        }
      />
    )
  }

  return children
}

export default AdminRoute
