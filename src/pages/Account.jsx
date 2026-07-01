import { motion as Motion } from 'framer-motion'
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ProfileAvatar from '../components/ProfileAvatar'
import useAuth from '../context/useAuth'
import { useAnnouncements } from '../hooks/useAnnouncements'
import { useEvents } from '../hooks/useEvents'
import {
  getDisplayName,
  getFriendlyAccountProfileError,
  removeProfileAvatar,
  updateMyAccountProfile,
  uploadProfileAvatar,
  validateProfileAvatar,
} from '../lib/accountProfile'
import { getPublishedResources } from '../lib/resources'

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
          className="h-13 w-full rounded-xl border border-slate-300 bg-slate-50/70 pl-12 pr-12 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
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
    isApprovedMember,
    canAccessAdmin,
    signIn,
    signUp,
    signOut,
    updateEmailNotifications,
    refreshProfile,
  } = useAuth()
  const requestedMode = searchParams.get('mode')
  const activeMode = requestedMode === 'signup' ? 'signup' : 'login'
  const redirectPath = searchParams.get('redirect')
  const { announcements } = useAnnouncements(3)
  const { upcoming, isLoading: isLoadingEvents } = useEvents()
  const [resources, setResources] = useState([])
  const [resourceOwnerId, setResourceOwnerId] = useState('')
  const [resourceError, setResourceError] = useState('')
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
  const [profileForm, setProfileForm] = useState({ nickname: '' })
  const [isNicknameDirty, setIsNicknameDirty] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const userId = user?.id || ''
  const displayName = getDisplayName(profile, user, 'Student')
  const profileNickname = profile?.nickname || ''
  const nicknameValue = isNicknameDirty
    ? profileForm.nickname
    : profileNickname
  const hasProfileChanges =
    Boolean(avatarFile) || nicknameValue.trim() !== profileNickname.trim()
  const isProfileSaved =
    isApprovedMember && !hasProfileChanges && !isSavingProfile
  const isProfileSaveDisabled =
    !isApprovedMember || isSavingProfile || isProfileSaved
  const profileSaveLabel = isSavingProfile
    ? 'Saving...'
    : isProfileSaved
      ? 'Saved'
      : 'Save profile'
  const dashboardAnnouncements = announcements.slice(0, 3)
  const dashboardEvents = upcoming.slice(0, 2)
  const dashboardResources = isApprovedMember ? resources.slice(0, 3) : []
  const isLoadingResources =
    isApprovedMember &&
    isConfigured &&
    Boolean(userId) &&
    resourceOwnerId !== userId
  const quickActions = useMemo(
    () => [
      {
        title: 'Student Portal',
        detail: 'Resources and curriculum',
        href: '/student-portal',
        icon: BookOpen,
      },
      {
        title: 'Events',
        detail: 'Schedules and activities',
        href: '/events',
        icon: CalendarDays,
      },
      {
        title: 'Announcements',
        detail: 'Official notices',
        href: '/announcements',
        icon: Bell,
      },
    ],
    [],
  )

  useEffect(() => {
    if (!userId || !isApprovedMember || !isConfigured) {
      return undefined
    }

    let isMounted = true

    getPublishedResources().then(({ data, error }) => {
      if (!isMounted) return

      if (error) {
        setResources([])
        setResourceError(error.message)
      } else {
        setResources(data || [])
        setResourceError('')
      }

      setResourceOwnerId(userId)
    })

    return () => {
      isMounted = false
    }
  }, [isApprovedMember, isConfigured, userId])

  useEffect(
    () => () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    },
    [avatarPreview],
  )

  const updateField = (field) => (event) => {
    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }))
    setMessage({ type: '', text: '' })
  }

  const updateProfileField = (field) => (event) => {
    setProfileForm((current) => ({
      ...current,
      [field]: event.target.value,
    }))
    if (field === 'nickname') setIsNicknameDirty(true)
    setMessage({ type: '', text: '' })
  }

  const handleAvatarSelection = (event) => {
    const [file] = event.target.files || []
    if (!file) return

    const fileError = validateProfileAvatar(file)
    if (fileError) {
      setMessage({ type: 'error', text: fileError })
      event.target.value = ''
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setMessage({ type: '', text: '' })
    event.target.value = ''
  }

  const resetSelectedAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview('')
  }

  const handleProfileSave = async (event) => {
    event.preventDefault()

    if (!isApprovedMember || !user) {
      setMessage({
        type: 'info',
        text: 'Your account must be approved before editing your profile.',
      })
      return
    }

    setIsSavingProfile(true)
    setMessage({ type: '', text: '' })

    let nextAvatarPath = profile?.avatar_path || null
    let uploadedAvatarPath = ''

    if (avatarFile) {
      const { data, error } = await uploadProfileAvatar(avatarFile, user.id)

      if (error) {
        setIsSavingProfile(false)
        setMessage({ type: 'error', text: error.message })
        return
      }

      nextAvatarPath = data.path
      uploadedAvatarPath = data.path
    }

    const { error } = await updateMyAccountProfile({
      nickname: nicknameValue,
      avatarPath: nextAvatarPath,
    })

    if (error) {
      if (uploadedAvatarPath) await removeProfileAvatar(uploadedAvatarPath)
      setIsSavingProfile(false)
      setMessage({
        type: 'error',
        text: getFriendlyAccountProfileError(error),
      })
      return
    }

    if (
      uploadedAvatarPath &&
      profile?.avatar_path &&
      profile.avatar_path !== uploadedAvatarPath
    ) {
      await removeProfileAvatar(profile.avatar_path)
    }

    await refreshProfile()
    resetSelectedAvatar()
    setIsNicknameDirty(false)
    setIsSavingProfile(false)
    setMessage({ type: 'success', text: 'Your profile has been updated.' })
  }

  const handleAvatarRemove = async () => {
    if (!isApprovedMember || !user) {
      setMessage({
        type: 'info',
        text: 'Your account must be approved before editing your profile.',
      })
      return
    }

    setIsSavingProfile(true)
    setMessage({ type: '', text: '' })

    const previousAvatarPath = profile?.avatar_path || ''
    const { error } = await updateMyAccountProfile({
      nickname: nicknameValue,
      avatarPath: null,
    })

    if (error) {
      setIsSavingProfile(false)
      setMessage({
        type: 'error',
        text: getFriendlyAccountProfileError(error),
      })
      return
    }

    if (previousAvatarPath) await removeProfileAvatar(previousAvatarPath)

    await refreshProfile()
    resetSelectedAvatar()
    setIsNicknameDirty(false)
    setIsSavingProfile(false)
    setMessage({ type: 'success', text: 'Profile photo removed.' })
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
      <main className="min-h-screen bg-slate-50 pt-[84px]">
        <section className="relative isolate overflow-hidden py-12 sm:py-16 lg:py-20">
          <div className="subtle-grid absolute inset-0 -z-20 opacity-60" />
          <div className="theme-ambient-orb absolute -right-24 -top-24 -z-10 size-80 rounded-full blur-3xl" />
          <div className="theme-ambient-orb-secondary absolute -bottom-28 -left-24 -z-10 size-80 rounded-full blur-3xl" />

          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="surface-card mx-auto max-w-5xl rounded-[2.25rem] p-6 sm:p-9 lg:p-10"
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
                    ? `Signed in as ${displayName}`
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
                <div className="mt-8 rounded-2xl border border-blue-300 bg-brand-50/45 p-6 text-center text-sm font-bold text-brand-600">
                  Checking your account session...
                </div>
              ) : user ? (
                <div className="mt-8 space-y-6">
                  <section className="relative isolate overflow-hidden rounded-3xl bg-navy-950 p-6 text-white shadow-[0_24px_70px_-46px_rgba(7,21,47,0.75)]">
                    <div className="subtle-grid absolute inset-0 -z-20 opacity-10" />
                    <div className="absolute -right-16 -top-20 -z-10 size-56 rounded-full bg-brand-600/25 blur-3xl" />
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold text-blue-200">
                          <Sparkles size={15} aria-hidden="true" />
                          Smart student dashboard
                        </div>
                        <h3 className="mt-4 text-3xl font-black tracking-tight">
                          Welcome back, {displayName}
                        </h3>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                          Here is the latest from the CpE organization, gathered
                          into one account view.
                        </p>
                        {canAccessAdmin && (
                          <Link
                            to="/admin"
                            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-extrabold text-navy-900 shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-50"
                          >
                            <LayoutDashboard size={16} aria-hidden="true" />
                            Open Dashboard
                            <ArrowRight size={15} aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt={`${displayName} profile preview`}
                          className="size-20 shrink-0 rounded-3xl border border-white/10 object-cover shadow-xl shadow-blue-950/20"
                        />
                      ) : (
                        <ProfileAvatar
                          path={profile?.avatar_path}
                          name={displayName}
                          className="size-20 rounded-3xl border border-white/10"
                          textClassName="text-xl"
                        />
                      )}
                    </div>
                  </section>

                  <section className="grid gap-4 sm:grid-cols-3">
                    {[
                      {
                        label: 'Profile status',
                        value: profile?.status || 'Pending',
                        icon: CheckCircle2,
                      },
                      {
                        label: 'Role',
                        value: profile?.role || 'Student',
                        icon: ShieldCheck,
                      },
                      {
                        label: 'Upcoming events',
                        value: isLoadingEvents ? '...' : dashboardEvents.length,
                        icon: CalendarDays,
                      },
                    ].map(({ label, value, icon: Icon }) => (
                      <article
                        key={label}
                        className="rounded-2xl border border-slate-300 bg-slate-50/70 p-5"
                      >
                        <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                          <Icon size={18} aria-hidden="true" />
                        </span>
                        <p className="mt-4 text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                          {label}
                        </p>
                        <p className="mt-2 break-words text-xl font-black capitalize text-navy-900">
                          {value}
                        </p>
                      </article>
                    ))}
                  </section>

                  {profileError && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                      Profile verification needs attention: {profileError}
                    </p>
                  )}

                  {!isApprovedMember && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <div className="flex gap-3">
                        <Clock3
                          size={21}
                          className="mt-0.5 shrink-0 text-amber-700"
                          aria-hidden="true"
                        />
                        <div>
                          <p className="text-sm font-extrabold text-amber-900">
                            Account approval required
                          </p>
                          <p className="mt-1 text-sm leading-6 text-amber-800">
                            Your account is currently{' '}
                            {profile?.status || 'pending'}. Private resources
                            will unlock after administrator approval.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <form
                    onSubmit={handleProfileSave}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-center gap-4">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt={`${displayName} profile preview`}
                            className="size-20 shrink-0 rounded-2xl object-cover"
                          />
                        ) : (
                          <ProfileAvatar
                            path={profile?.avatar_path}
                            name={displayName}
                            className="size-20 rounded-2xl"
                            textClassName="text-xl"
                          />
                        )}
                        <div>
                          <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                            My account profile
                          </p>
                          <h3 className="mt-1 text-xl font-black text-navy-900">
                            Nickname and photo
                          </h3>
                          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                            This is the friendly name and photo shown around the
                            site. Your official full name stays unchanged.
                          </p>
                        </div>
                      </div>

                      {!isApprovedMember && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-800">
                          <Clock3 size={14} aria-hidden="true" />
                          Approval required
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                      <label htmlFor="account-nickname" className="block">
                        <span className="mb-2 block text-xs font-extrabold tracking-wide text-slate-600 uppercase">
                          Nickname
                        </span>
                        <input
                          id="account-nickname"
                          type="text"
                          value={nicknameValue}
                          onChange={updateProfileField('nickname')}
                          maxLength={40}
                          disabled={!isApprovedMember || isSavingProfile}
                          placeholder="Add a nickname"
                          autoComplete="nickname"
                          className="h-13 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </label>

                      <div className="flex flex-wrap gap-2">
                        <label
                          className={`inline-flex min-h-13 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-600 transition hover:border-brand-500 hover:text-brand-600 ${
                            !isApprovedMember || isSavingProfile
                              ? 'pointer-events-none opacity-60'
                              : ''
                          }`}
                        >
                          <Camera size={17} aria-hidden="true" />
                          Change photo
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={handleAvatarSelection}
                            disabled={!isApprovedMember || isSavingProfile}
                          />
                        </label>

                        {(profile?.avatar_path || avatarPreview) && (
                          <button
                            type="button"
                            onClick={
                              avatarPreview
                                ? resetSelectedAvatar
                                : handleAvatarRemove
                            }
                            disabled={!isApprovedMember || isSavingProfile}
                            className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-3 text-sm font-extrabold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 size={17} aria-hidden="true" />
                            {avatarPreview ? 'Cancel photo' : 'Remove photo'}
                          </button>
                        )}

                        <button
                          type="submit"
                          disabled={isProfileSaveDisabled}
                          className={`inline-flex min-h-13 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold transition disabled:cursor-not-allowed ${
                            isProfileSaved
                              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'bg-brand-600 text-white shadow-lg shadow-blue-600/20 hover:bg-brand-700 disabled:opacity-60'
                          }`}
                        >
                          {isProfileSaved ? (
                            <CheckCircle2 size={17} aria-hidden="true" />
                          ) : (
                            <Save size={17} aria-hidden="true" />
                          )}
                          {profileSaveLabel}
                        </button>
                      </div>
                    </div>
                  </form>

                  <section className="grid gap-4 lg:grid-cols-2">
                    <article className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                            Latest for you
                          </p>
                          <h3 className="mt-1 text-xl font-black text-navy-900">
                            Announcements
                          </h3>
                        </div>
                        <Bell size={22} className="text-brand-600" />
                      </div>
                      <div className="mt-5 grid gap-3">
                        {dashboardAnnouncements.length > 0 ? (
                          dashboardAnnouncements.map((announcement) => (
                            <Link
                              key={announcement.id}
                              to={`/announcements/${announcement.id}`}
                              className="group rounded-xl border border-slate-300 bg-slate-50/70 p-4 transition hover:border-brand-300 hover:bg-white"
                            >
                              <p className="text-xs font-bold text-brand-600">
                                {announcement.category} - {announcement.date}
                              </p>
                              <p className="mt-1 line-clamp-2 text-sm font-extrabold text-navy-900 group-hover:text-brand-600">
                                {announcement.title}
                              </p>
                            </Link>
                          ))
                        ) : (
                          <p className="rounded-xl border border-dashed border-blue-200 bg-brand-50/35 p-4 text-sm leading-6 text-slate-600">
                            No announcements are available yet.
                          </p>
                        )}
                      </div>
                    </article>

                    <article className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                            Calendar
                          </p>
                          <h3 className="mt-1 text-xl font-black text-navy-900">
                            Upcoming events
                          </h3>
                        </div>
                        <CalendarDays size={22} className="text-brand-600" />
                      </div>
                      <div className="mt-5 grid gap-3">
                        {isLoadingEvents ? (
                          <p className="rounded-xl bg-brand-50/45 p-4 text-sm font-bold text-brand-600">
                            Loading events...
                          </p>
                        ) : dashboardEvents.length > 0 ? (
                          dashboardEvents.map((event) => (
                            <Link
                              key={event.id}
                              to="/events"
                              className="group rounded-xl border border-slate-300 bg-slate-50/70 p-4 transition hover:border-brand-300 hover:bg-white"
                            >
                              <p className="text-xs font-bold text-brand-600">
                                {event.date} - {event.time}
                              </p>
                              <p className="mt-1 line-clamp-2 text-sm font-extrabold text-navy-900 group-hover:text-brand-600">
                                {event.title}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {event.venue}
                              </p>
                            </Link>
                          ))
                        ) : (
                          <p className="rounded-xl border border-dashed border-blue-200 bg-brand-50/35 p-4 text-sm leading-6 text-slate-600">
                            No upcoming events are scheduled yet.
                          </p>
                        )}
                      </div>
                    </article>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                          Learning access
                        </p>
                        <h3 className="mt-1 text-xl font-black text-navy-900">
                          Student resources
                        </h3>
                      </div>
                      <Link
                        to="/student-portal#resources"
                        className="secondary-button"
                      >
                        Open resources
                        <ArrowRight size={16} aria-hidden="true" />
                      </Link>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {!isApprovedMember ? (
                        <p className="rounded-xl border border-dashed border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                          Private resources will appear here after your account
                          is approved.
                        </p>
                      ) : isLoadingResources ? (
                        <p className="rounded-xl bg-brand-50/45 p-4 text-sm font-bold text-brand-600">
                          Loading resources...
                        </p>
                      ) : resourceError ? (
                        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                          {resourceError}
                        </p>
                      ) : dashboardResources.length > 0 ? (
                        dashboardResources.map((resource) => (
                          <div
                            key={resource.id}
                            className="rounded-xl border border-slate-300 bg-slate-50/70 p-4"
                          >
                            <p className="text-xs font-bold text-brand-600">
                              {resource.category}
                              {resource.course_code
                                ? ` - ${resource.course_code}`
                                : ''}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm font-extrabold text-navy-900">
                              {resource.title}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-xl border border-dashed border-blue-200 bg-brand-50/35 p-4 text-sm leading-6 text-slate-600">
                          No resources have been published yet.
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="grid gap-3 sm:grid-cols-2">
                    {quickActions.map(({ title, detail, href, icon: Icon }) => (
                      <Link
                        key={title}
                        to={href}
                        className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_18px_45px_-34px_rgba(21,94,239,0.45)]"
                      >
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                          <Icon size={19} aria-hidden="true" />
                        </span>
                        <span>
                          <span className="block text-sm font-extrabold text-navy-900">
                            {title}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {detail}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </section>

                  {profile && (
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-blue-300 bg-brand-50/45 p-5">
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

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSubmitting}
                    className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-extrabold text-slate-600 transition hover:border-brand-500 hover:text-brand-600 disabled:cursor-wait disabled:opacity-60"
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
                          className="h-13 w-full rounded-xl border border-slate-300 bg-slate-50/70 pl-12 pr-4 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
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
                          className="h-13 w-full rounded-xl border border-slate-300 bg-slate-50/70 pl-12 pr-4 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
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
                      className="h-13 w-full rounded-xl border border-slate-300 bg-slate-50/70 pl-12 pr-4 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
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
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-blue-300 bg-brand-50/45 p-4">
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
    </>
  )
}

export default Account
