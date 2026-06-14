import { motion as Motion } from 'framer-motion'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import useAuth from '../context/useAuth'

const modes = [
  { id: 'login', label: 'Log In', icon: LogIn },
  { id: 'signup', label: 'Sign Up', icon: UserPlus },
]

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-xs font-extrabold tracking-wide text-slate-600 uppercase">
        {label}
      </span>
      <span className="relative block">
        <LockKeyhole
          size={19}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          required
          minLength={8}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-12 pr-12 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-brand-600"
          aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
        >
          {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  )
}

function Account() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    user,
    profile,
    profileError,
    isLoading,
    isConfigured,
    canAccessAdmin,
    signIn,
    signUp,
    signOut,
    updateEmailNotifications,
  } = useAuth()
  const requestedMode = searchParams.get('mode')
  const activeMode = requestedMode === 'signup' ? 'signup' : 'login'
  const redirectPath = searchParams.get('redirect')
  const [formData, setFormData] = useState({
    fullName: '',
    studentNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    emailNotifications: true,
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field) => (event) => {
    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }))
    setMessage({ type: '', text: '' })
  }

  const selectMode = (mode) => {
    setSearchParams(mode === 'signup' ? { mode: 'signup' } : {})
    setMessage({ type: '', text: '' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!isConfigured) {
      setMessage({
        type: 'info',
        text: 'Add the Supabase environment values to enable authentication.',
      })
      return
    }

    if (
      activeMode === 'signup' &&
      formData.password !== formData.confirmPassword
    ) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    if (activeMode === 'signup') {
      const { data, error } = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        studentNumber: formData.studentNumber,
        emailNotifications: formData.emailNotifications,
      })

      setIsSubmitting(false)

      if (error) {
        setMessage({ type: 'error', text: error.message })
        return
      }

      setMessage({
        type: 'success',
        text: data.session
          ? 'Account created and signed in. Your organization profile is pending approval.'
          : 'Account created. Check your email to confirm the address before signing in.',
      })
      return
    }

    const { error } = await signIn({
      email: formData.email,
      password: formData.password,
    })

    setIsSubmitting(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }

    setMessage({ type: 'success', text: 'Signed in successfully.' })
    if (redirectPath?.startsWith('/')) navigate(redirectPath)
  }

  const handleSignOut = async () => {
    setIsSubmitting(true)
    const { error } = await signOut()
    setIsSubmitting(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }

    setMessage({ type: 'success', text: 'You have been signed out.' })
  }

  const handleEmailNotifications = async (event) => {
    const enabled = event.target.checked
    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    const { error } = await updateEmailNotifications(enabled)
    setIsSubmitting(false)

    setMessage(
      error
        ? { type: 'error', text: error.message }
        : {
            type: 'success',
            text: enabled
              ? 'Email notifications are enabled.'
              : 'Email notifications are disabled.',
          },
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 pt-[72px]">
        <section className="relative isolate overflow-hidden py-14 sm:py-18 lg:py-22">
          <div className="subtle-grid absolute inset-0 -z-20 opacity-60" />
          <div className="absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-brand-100/70 blur-3xl" />
          <div className="absolute -bottom-28 -left-24 -z-10 size-80 rounded-full bg-blue-100/60 blur-3xl" />

          <div className="section-shell grid items-stretch gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <Motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative isolate overflow-hidden rounded-3xl bg-navy-950 p-7 text-white shadow-[0_34px_90px_-48px_rgba(7,21,47,0.85)] sm:p-10 lg:p-12"
            >
              <div className="subtle-grid absolute inset-0 -z-20 opacity-10" />
              <div className="absolute -right-20 -top-20 -z-10 size-64 rounded-full bg-brand-600/30 blur-3xl" />

              <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-blue-200">
                <ShieldCheck size={27} aria-hidden="true" />
              </span>
              <p className="mt-8 text-xs font-extrabold tracking-[0.22em] text-blue-300 uppercase">
                Member access
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                Your organization portal
              </h1>
              <p className="mt-5 max-w-lg text-base leading-8 text-slate-300">
                A future secure account space for organization members,
                student resources, registrations, and personalized updates.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  'Access member-only resources when available',
                  'Keep organization registrations in one place',
                  'Use verified student account information',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-blue-400/15 text-blue-200">
                      <ArrowRight size={14} aria-hidden="true" />
                    </span>
                    <p className="text-sm leading-6 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.07] p-5">
                <p className="text-sm font-extrabold text-white">
                  {isConfigured
                    ? 'Secure authentication'
                    : 'Backend setup required'}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {isConfigured
                    ? 'Supabase manages account sessions securely. Organization roles are verified from the protected profiles table.'
                    : 'Authentication is ready in the codebase, but remains inactive until the Supabase project values are added to .env.local.'}
                </p>
              </div>
            </Motion.div>

            <Motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.42)] sm:p-9 lg:p-10"
            >
              {!user && (
                <div
                  role="tablist"
                  aria-label="Account access"
                  className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1.5"
                >
                  {modes.map(({ id, label, icon: Icon }) => {
                    const isActive = activeMode === id

                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => selectMode(id)}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition ${
                          isActive
                            ? 'bg-white text-brand-600 shadow-sm'
                            : 'text-slate-600 hover:text-navy-900'
                        }`}
                      >
                        <Icon size={17} aria-hidden="true" />
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="mt-8">
                <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
                  {user
                    ? 'Authenticated account'
                    : activeMode === 'signup'
                      ? 'Create your account'
                      : 'Welcome back'}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-navy-900">
                  {user
                    ? `Signed in as ${profile?.full_name || user.email}`
                    : activeMode === 'signup'
                      ? 'Join the organization portal'
                      : 'Log in to your account'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {user
                    ? 'Your session is active on this device.'
                    : activeMode === 'signup'
                      ? 'Use your student information to create a portal account.'
                      : 'Enter your registered email and password to continue.'}
                </p>
              </div>

              {isLoading ? (
                <div className="mt-8 rounded-2xl border border-blue-100 bg-brand-50/45 p-6 text-center text-sm font-bold text-brand-600">
                  Checking your account session...
                </div>
              ) : user ? (
                <div className="mt-8 grid gap-4">
                  {[
                    ['Email', user.email],
                    ['Role', profile?.role || 'Profile unavailable'],
                    ['Status', profile?.status || 'Awaiting profile'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
                    >
                      <p className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                        {label}
                      </p>
                      <p className="mt-2 break-words font-extrabold capitalize text-navy-900">
                        {value}
                      </p>
                    </div>
                  ))}

                  {profileError && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                      Profile verification needs attention: {profileError}
                    </p>
                  )}

                  {profile && (
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-blue-100 bg-brand-50/45 p-5">
                      <input
                        type="checkbox"
                        checked={profile.email_notifications ?? true}
                        onChange={handleEmailNotifications}
                        disabled={isSubmitting}
                        className="mt-1 size-4 accent-blue-600"
                      />
                      <span>
                        <span className="block text-sm font-extrabold text-navy-900">
                          News and announcement emails
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-600">
                          Receive an email when the organization publishes a
                          new story or announcement.
                        </span>
                      </span>
                    </label>
                  )}

                  {canAccessAdmin && (
                    <a
                      href="/admin"
                      className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-brand-700"
                    >
                      <ShieldCheck size={18} aria-hidden="true" />
                      Open Admin Dashboard
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSubmitting}
                    className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-extrabold text-slate-600 transition hover:border-brand-500 hover:text-brand-600 disabled:cursor-wait disabled:opacity-60"
                  >
                    <LogIn size={18} className="rotate-180" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              ) : (
                <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
                {activeMode === 'signup' && (
                  <>
                    <label htmlFor="account-full-name" className="block">
                      <span className="mb-2 block text-xs font-extrabold tracking-wide text-slate-600 uppercase">
                        Full name
                      </span>
                      <span className="relative block">
                        <UserRound
                          size={19}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          aria-hidden="true"
                        />
                        <input
                          id="account-full-name"
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={updateField('fullName')}
                          placeholder="Enter your full name"
                          autoComplete="name"
                          className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-12 pr-4 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                        />
                      </span>
                    </label>

                    <label htmlFor="account-student-number" className="block">
                      <span className="mb-2 block text-xs font-extrabold tracking-wide text-slate-600 uppercase">
                        Student number
                      </span>
                      <span className="relative block">
                        <ShieldCheck
                          size={19}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          aria-hidden="true"
                        />
                        <input
                          id="account-student-number"
                          type="text"
                          required
                          value={formData.studentNumber}
                          onChange={updateField('studentNumber')}
                          placeholder="Enter your student number"
                          autoComplete="off"
                          className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-12 pr-4 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                        />
                      </span>
                    </label>
                  </>
                )}

                <label htmlFor="account-email" className="block">
                  <span className="mb-2 block text-xs font-extrabold tracking-wide text-slate-600 uppercase">
                    Email address
                  </span>
                  <span className="relative block">
                    <Mail
                      size={19}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="account-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={updateField('email')}
                      placeholder="Enter your email address"
                      autoComplete="email"
                      className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-12 pr-4 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                    />
                  </span>
                </label>

                <PasswordField
                  id="account-password"
                  label="Password"
                  value={formData.password}
                  onChange={updateField('password')}
                  placeholder="Enter at least 8 characters"
                  autoComplete={
                    activeMode === 'signup'
                      ? 'new-password'
                      : 'current-password'
                  }
                />

                {activeMode === 'signup' && (
                  <PasswordField
                    id="account-confirm-password"
                    label="Confirm password"
                    value={formData.confirmPassword}
                    onChange={updateField('confirmPassword')}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                  />
                )}

                {activeMode === 'signup' && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-blue-100 bg-brand-50/45 p-4">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifications}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          emailNotifications: event.target.checked,
                        }))
                      }
                      className="mt-0.5 size-4 accent-blue-600"
                    />
                    <span>
                      <span className="block text-sm font-extrabold text-navy-900">
                        Email me organization updates
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">
                        Receive new news and announcements. You can change this
                        setting from your account at any time.
                      </span>
                    </span>
                  </label>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {activeMode === 'signup' ? (
                    <UserPlus size={18} aria-hidden="true" />
                  ) : (
                    <LogIn size={18} aria-hidden="true" />
                  )}
                  {isSubmitting
                    ? 'Please wait...'
                    : activeMode === 'signup'
                      ? 'Create account'
                      : 'Log in securely'}
                </button>
                </form>
              )}

              <p
                className={`mt-5 min-h-6 text-center text-sm font-bold ${
                  message.type === 'error'
                    ? 'text-red-600'
                    : message.type === 'success'
                      ? 'text-emerald-600'
                      : 'text-brand-600'
                }`}
                aria-live="polite"
              >
                {message.text}
              </p>
            </Motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default Account
