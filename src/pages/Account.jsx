import { motion as Motion } from 'framer-motion'
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  BookOpen,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  GraduationCap,
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
import { getYearLevelLabel, yearLevelOptions } from '../data/yearLevels'
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

const signupTypes = [
  {
    id: 'student',
    label: 'Student',
    detail: 'Student number and year level',
    icon: GraduationCap,
  },
  {
    id: 'faculty',
    label: 'Faculty',
    detail: 'No student number required',
    icon: BriefcaseBusiness,
  },
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
    <label htmlFor={id} className="account-form-field">
      <span className="account-form-label">
        {label}
      </span>
      <span className="account-input-wrap">
        <LockKeyhole
          size={19}
          className="account-input-icon"
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
          className="account-input account-input-with-icon account-password-input"
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          className="account-password-toggle"
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
    accountType: 'student',
    fullName: '',
    studentNumber: '',
    yearLevel: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileForm, setProfileForm] = useState({ nickname: '' })
  const [isNicknameDirty, setIsNicknameDirty] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const userId = user?.id || ''
  const isStudentSignup =
    activeMode === 'signup' && formData.accountType === 'student'
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

  const selectAccountType = (event) => {
    const accountType = event.target.value

    setFormData((current) => ({
      ...current,
      accountType,
      ...(accountType === 'faculty'
        ? { studentNumber: '', yearLevel: '' }
        : {}),
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

    if (isStudentSignup && !formData.yearLevel) {
      setMessage({ type: 'error', text: 'Please select your year level.' })
      return
    }

    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    if (activeMode === 'signup') {
      const { data, error } = await signUp({
        email: formData.email,
        password: formData.password,
        accountType: formData.accountType,
        fullName: formData.fullName,
        studentNumber: formData.studentNumber,
        yearLevel: formData.yearLevel,
      })

      setIsSubmitting(false)

      if (error) {
        const errorText = error.message?.toLowerCase() || ''
        const isDatabaseSignupError = errorText.includes(
          'database error saving new user',
        )
        setMessage({
          type: 'error',
          text: isDatabaseSignupError
            ? formData.accountType === 'student'
              ? 'This student number is already registered. Use the existing account or a different student number. If it belongs to an old test account, delete that account from Users & Roles first.'
              : 'Faculty accounts do not use a student number. Leave that field blank and run the latest supabase/users.sql trigger migration if this still appears.'
            : error.message,
        })
        return
      }

      if (!data.session) {
        setMessage({
          type: 'info',
          text: 'Account created, but email confirmation is enabled in Supabase. Disable Confirm email under Authentication > Providers > Email, then sign in without confirming an email.',
        })
        return
      }

      setMessage({
        type: 'success',
        text: 'Account created and signed in. Your organization profile is pending approval.',
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

  return (
    <>
      <main className="account-page min-h-screen bg-slate-50 pt-[84px]">
        <section className="account-page-section relative isolate overflow-hidden py-8 sm:py-12 lg:py-16">
          <div className="subtle-grid absolute inset-0 -z-20 opacity-60" />
          <div className="theme-ambient-orb absolute -right-24 -top-24 -z-10 size-80 rounded-full blur-3xl" />
          <div className="theme-ambient-orb-secondary absolute -bottom-28 -left-24 -z-10 size-80 rounded-full blur-3xl" />

          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className={`account-shell ${user ? 'account-shell-member' : 'account-shell-access'}`}
            >
              {!user && (
                <div className="account-access-tabs" role="tablist" aria-label="Account access">
                  {modes.map(({ id, label, icon: Icon }) => {
                    const isActive = activeMode === id

                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => selectMode(id)}
                        className={`account-access-tab ${isActive ? 'account-access-tab-active' : ''}`}
                      >
                        <Icon size={17} aria-hidden="true" />
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}

              {isLoading ? (
                <div className="account-loading" role="status">
                  Checking your account session...
                </div>
              ) : user ? (
                <div className="account-member-layout">
                  <section className="account-profile-hero">
                    <div className="account-profile-identity">
                      <div className="account-hero-avatar">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt={`${displayName} profile preview`}
                            className="account-avatar-image"
                          />
                        ) : (
                          <ProfileAvatar
                            path={profile?.avatar_path}
                            name={displayName}
                            className="account-avatar-image"
                            textClassName="text-xl"
                          />
                        )}
                        <span
                          className={`account-avatar-status ${isApprovedMember ? 'account-avatar-status-approved' : ''}`}
                          aria-label={isApprovedMember ? 'Approved account' : 'Pending account'}
                        />
                      </div>
                      <div className="account-profile-copy">
                        <p className="account-eyebrow">
                          <Sparkles size={13} aria-hidden="true" />
                          Account overview
                        </p>
                        <h1>Welcome back, {displayName}</h1>
                        <p className="account-profile-email">
                          <Mail size={15} aria-hidden="true" />
                          {user.email}
                        </p>
                        <div className="account-profile-badges">
                          <span className="account-status-badge">
                            <CheckCircle2 size={13} aria-hidden="true" />
                            {profile?.status || 'Pending'}
                          </span>
                          <span className="account-role-badge">
                            {profile?.role || 'Student'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="account-profile-actions">
                      {canAccessAdmin && (
                        <Link to="/admin" className="account-primary-action">
                          <LayoutDashboard size={16} aria-hidden="true" />
                          Open Dashboard
                          <ArrowRight size={15} aria-hidden="true" />
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={isSubmitting}
                        className="account-secondary-action"
                      >
                        <LogIn size={16} className="rotate-180" aria-hidden="true" />
                        Sign out
                      </button>
                    </div>
                  </section>

                  <section className="account-status-strip" aria-label="Account summary">
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
                        label: 'Year level',
                        value: getYearLevelLabel(profile?.year_level),
                        icon: GraduationCap,
                      },
                      {
                        label: 'Upcoming events',
                        value: isLoadingEvents ? '...' : dashboardEvents.length,
                        icon: CalendarDays,
                      },
                    ].map(({ label, value, icon: Icon }) => (
                      <article key={label} className="account-stat-item">
                        <span className="account-stat-icon">
                          <Icon size={17} aria-hidden="true" />
                        </span>
                        <span className="account-stat-copy">
                          <span>{label}</span>
                          <strong>{value}</strong>
                        </span>
                      </article>
                    ))}
                  </section>

                  {profileError && (
                    <p className="account-alert account-alert-warning" role="alert">
                      Profile verification needs attention: {profileError}
                    </p>
                  )}

                  {!isApprovedMember && (
                    <div className="account-approval-note">
                      <Clock3 size={19} aria-hidden="true" />
                      <div>
                        <strong>Account approval required</strong>
                        <p>
                          Your account is currently {profile?.status || 'pending'}.
                          Profile editing and private resources unlock after approval.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="account-content-grid">
                    <div className="account-main-column">
                      <form onSubmit={handleProfileSave} className="account-panel account-editor-panel">
                        <div className="account-panel-heading">
                          <div>
                            <p className="account-eyebrow">Personal details</p>
                            <h2>Make your profile yours</h2>
                          </div>
                          <span className={`account-editor-state ${isApprovedMember ? 'account-editor-state-ready' : ''}`}>
                            {isApprovedMember ? 'Editable' : 'Locked'}
                          </span>
                        </div>

                        <div className="account-editor-layout">
                          <div className="account-editor-photo">
                            {avatarPreview ? (
                              <img
                                src={avatarPreview}
                                alt={`${displayName} profile preview`}
                                className="account-editor-avatar"
                              />
                            ) : (
                              <ProfileAvatar
                                path={profile?.avatar_path}
                                name={displayName}
                                className="account-editor-avatar"
                                textClassName="text-lg"
                              />
                            )}
                            <label
                              className={`account-photo-button ${!isApprovedMember || isSavingProfile ? 'account-control-disabled' : ''}`}
                            >
                              <Camera size={15} aria-hidden="true" />
                              Change photo
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                onChange={handleAvatarSelection}
                                disabled={!isApprovedMember || isSavingProfile}
                              />
                            </label>
                          </div>

                          <div className="account-editor-fields">
                            <label htmlFor="account-nickname" className="account-form-field">
                              <span className="account-form-label">Nickname</span>
                              <input
                                id="account-nickname"
                                type="text"
                                value={nicknameValue}
                                onChange={updateProfileField('nickname')}
                                maxLength={40}
                                disabled={!isApprovedMember || isSavingProfile}
                                placeholder="Add a nickname"
                                autoComplete="nickname"
                                className="account-input"
                              />
                            </label>
                            <p className="account-field-note">
                              This friendly name and photo appear around the site. Your official name stays unchanged.
                            </p>
                            <div className="account-editor-controls">
                              {(profile?.avatar_path || avatarPreview) && (
                                <button
                                  type="button"
                                  onClick={avatarPreview ? resetSelectedAvatar : handleAvatarRemove}
                                  disabled={!isApprovedMember || isSavingProfile}
                                  className="account-danger-action"
                                >
                                  <Trash2 size={15} aria-hidden="true" />
                                  {avatarPreview ? 'Cancel photo' : 'Remove photo'}
                                </button>
                              )}
                              <button
                                type="submit"
                                disabled={isProfileSaveDisabled}
                                className={`account-save-action ${isProfileSaved ? 'account-save-action-saved' : ''}`}
                              >
                                {isProfileSaved ? (
                                  <CheckCircle2 size={16} aria-hidden="true" />
                                ) : (
                                  <Save size={16} aria-hidden="true" />
                                )}
                                {profileSaveLabel}
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>

                      <section className="account-panel account-updates-panel">
                        <div className="account-panel-heading">
                          <div>
                            <p className="account-eyebrow">Your updates</p>
                            <h2>Stay in the loop</h2>
                          </div>
                          <Bell size={19} aria-hidden="true" />
                        </div>
                        <div className="account-updates-grid">
                          <article className="account-update-group">
                            <div className="account-update-heading">
                              <span className="account-update-icon"><Bell size={15} aria-hidden="true" /></span>
                              <div>
                                <h3>Announcements</h3>
                                <span>Latest notices</span>
                              </div>
                            </div>
                            <div className="account-update-list">
                              {dashboardAnnouncements.length > 0 ? (
                                dashboardAnnouncements.map((announcement) => (
                                  <Link
                                    key={announcement.id}
                                    to={`/announcements/${announcement.id}`}
                                    className="account-update-item"
                                  >
                                    <span>{announcement.category} - {announcement.date}</span>
                                    <strong>{announcement.title}</strong>
                                  </Link>
                                ))
                              ) : (
                                <p className="account-empty-state">No announcements are available yet.</p>
                              )}
                            </div>
                          </article>

                          <article className="account-update-group">
                            <div className="account-update-heading">
                              <span className="account-update-icon"><CalendarDays size={15} aria-hidden="true" /></span>
                              <div>
                                <h3>Upcoming events</h3>
                                <span>What is next</span>
                              </div>
                            </div>
                            <div className="account-update-list">
                              {isLoadingEvents ? (
                                <p className="account-empty-state account-empty-state-info">Loading events...</p>
                              ) : dashboardEvents.length > 0 ? (
                                dashboardEvents.map((event) => (
                                  <Link key={event.id} to="/events" className="account-update-item">
                                    <span>{event.date} - {event.time}</span>
                                    <strong>{event.title}</strong>
                                    <small>{event.venue}</small>
                                  </Link>
                                ))
                              ) : (
                                <p className="account-empty-state">No upcoming events are scheduled yet.</p>
                              )}
                            </div>
                          </article>
                        </div>
                      </section>
                    </div>

                    <aside className="account-side-column">
                      <section className="account-panel account-details-panel">
                        <div className="account-panel-heading">
                          <div>
                            <p className="account-eyebrow">Verified information</p>
                            <h2>Account details</h2>
                          </div>
                          <ShieldCheck size={19} aria-hidden="true" />
                        </div>
                        <dl className="account-detail-list">
                          <div><dt>Full name</dt><dd>{profile?.full_name || 'Not provided'}</dd></div>
                          <div><dt>Student number</dt><dd>{profile?.student_number || 'Not provided'}</dd></div>
                          <div><dt>Year level</dt><dd>{getYearLevelLabel(profile?.year_level)}</dd></div>
                          <div><dt>Access level</dt><dd>{profile?.role || 'Student'}</dd></div>
                        </dl>
                      </section>

                      <section className="account-panel account-links-panel">
                        <div className="account-panel-heading">
                          <div>
                            <p className="account-eyebrow">Shortcuts</p>
                            <h2>Quick access</h2>
                          </div>
                          <ArrowRight size={18} aria-hidden="true" />
                        </div>
                        <div className="account-link-list">
                          {quickActions.map(({ title, detail, href, icon: Icon }) => (
                            <Link key={title} to={href} className="account-quick-link">
                              <span className="account-quick-icon"><Icon size={16} aria-hidden="true" /></span>
                              <span><strong>{title}</strong><small>{detail}</small></span>
                              <ArrowRight size={15} aria-hidden="true" />
                            </Link>
                          ))}
                        </div>
                      </section>

                      <section className="account-panel account-resources-panel">
                        <div className="account-panel-heading">
                          <div>
                            <p className="account-eyebrow">Learning access</p>
                            <h2>Resources</h2>
                          </div>
                          <BookOpen size={19} aria-hidden="true" />
                        </div>
                        {!isApprovedMember ? (
                          <p className="account-empty-state account-empty-state-warning">Resources appear after approval.</p>
                        ) : isLoadingResources ? (
                          <p className="account-empty-state account-empty-state-info">Loading resources...</p>
                        ) : resourceError ? (
                          <p className="account-empty-state account-empty-state-error">{resourceError}</p>
                        ) : dashboardResources.length > 0 ? (
                          <div className="account-resource-list">
                            {dashboardResources.map((resource) => (
                              <div key={resource.id} className="account-resource-item">
                                <span>{resource.category}{resource.course_code ? ` - ${resource.course_code}` : ''}</span>
                                <strong>{resource.title}</strong>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="account-empty-state">No resources have been published yet.</p>
                        )}
                        <Link to="/student-portal#resources" className="account-panel-link">
                          Open student portal
                          <ArrowRight size={15} aria-hidden="true" />
                        </Link>
                      </section>
                    </aside>
                  </div>
                </div>
              ) : (
                <div className="account-access-layout">
                  <div className="account-access-copy">
                    <span className="account-access-icon"><ShieldCheck size={22} aria-hidden="true" /></span>
                    <p className="account-eyebrow">
                      {activeMode === 'signup' ? 'New member access' : 'Member access'}
                    </p>
                    <h1>
                      {activeMode === 'signup' ? 'Join ICpEP Connect' : 'Welcome back'}
                    </h1>
                    <p>
                      {activeMode === 'signup'
                        ? 'Create a student or faculty account to follow organization updates, resources, events, and community conversations.'
                        : 'Sign in to manage your profile and access the parts of the portal available to you.'}
                    </p>
                    <div className="account-access-points">
                      <span><CheckCircle2 size={15} aria-hidden="true" /> Verified member access</span>
                      <span><CheckCircle2 size={15} aria-hidden="true" /> Student year-level details when applicable</span>
                      <span><CheckCircle2 size={15} aria-hidden="true" /> News, events, and resources</span>
                    </div>
                  </div>

                  <form className="account-auth-form" onSubmit={handleSubmit}>
                    <div className="account-form-heading">
                      <h2>{activeMode === 'signup' ? 'Create account' : 'Log in'}</h2>
                      <p>{activeMode === 'signup' ? 'Use an email address you can access. Student accounts include year-level details; faculty accounts do not need a student number.' : 'Use your registered email and password.'}</p>
                    </div>

                    {activeMode === 'signup' && (
                      <div className="account-signup-fields">
                        <div className="account-type-field">
                          <span className="account-form-label">Account type</span>
                          <div className="account-type-options" role="radiogroup" aria-label="Account type">
                            {signupTypes.map(({ id, label, detail, icon: Icon }) => (
                              <label
                                key={id}
                                className={`account-type-option ${formData.accountType === id ? 'account-type-option-active' : ''}`}
                              >
                                <input
                                  type="radio"
                                  name="accountType"
                                  value={id}
                                  checked={formData.accountType === id}
                                  onChange={selectAccountType}
                                  className="account-type-radio"
                                />
                                <span className="account-type-option-icon">
                                  <Icon size={17} aria-hidden="true" />
                                </span>
                                <span className="account-type-option-copy">
                                  <strong>{label}</strong>
                                  <small>{detail}</small>
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <label htmlFor="account-full-name" className="account-form-field">
                          <span className="account-form-label">Full name</span>
                          <span className="account-input-wrap">
                            <UserRound size={18} className="account-input-icon" aria-hidden="true" />
                            <input id="account-full-name" type="text" required value={formData.fullName} onChange={updateField('fullName')} placeholder="Enter your full name" autoComplete="name" className="account-input account-input-with-icon" />
                          </span>
                        </label>
                        {isStudentSignup && (
                          <>
                            <label htmlFor="account-student-number" className="account-form-field">
                              <span className="account-form-label">Student number</span>
                              <span className="account-input-wrap">
                                <ShieldCheck size={18} className="account-input-icon" aria-hidden="true" />
                                <input id="account-student-number" type="text" required value={formData.studentNumber} onChange={updateField('studentNumber')} placeholder="Enter your student number" autoComplete="off" className="account-input account-input-with-icon" />
                              </span>
                            </label>
                            <label htmlFor="account-year-level" className="account-form-field">
                              <span className="account-form-label">Year level</span>
                              <span className="account-input-wrap">
                                <GraduationCap size={18} className="account-input-icon" aria-hidden="true" />
                                <select id="account-year-level" required value={formData.yearLevel} onChange={updateField('yearLevel')} className="account-input account-input-with-icon account-select">
                                  <option value="">Select your year level</option>
                                  {yearLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                              </span>
                            </label>
                          </>
                        )}
                      </div>
                    )}

                    <label htmlFor="account-email" className="account-form-field">
                      <span className="account-form-label">Email address</span>
                      <span className="account-input-wrap">
                        <Mail size={18} className="account-input-icon" aria-hidden="true" />
                        <input id="account-email" type="email" required value={formData.email} onChange={updateField('email')} placeholder="Enter your email address" autoComplete="email" className="account-input account-input-with-icon" />
                      </span>
                    </label>

                    <PasswordField id="account-password" label="Password" value={formData.password} onChange={updateField('password')} placeholder="Enter at least 8 characters" autoComplete={activeMode === 'signup' ? 'new-password' : 'current-password'} />

                    {activeMode === 'signup' && (
                      <PasswordField id="account-confirm-password" label="Confirm password" value={formData.confirmPassword} onChange={updateField('confirmPassword')} placeholder="Repeat your password" autoComplete="new-password" />
                    )}

                    <button type="submit" disabled={isSubmitting} className="account-submit-button">
                      {activeMode === 'signup' ? <UserPlus size={17} aria-hidden="true" /> : <LogIn size={17} aria-hidden="true" />}
                      {isSubmitting ? 'Please wait...' : activeMode === 'signup' ? 'Create account' : 'Log in securely'}
                    </button>
                  </form>
                </div>
              )}

              <p
                className={`account-message ${
                  message.type === 'error'
                    ? 'account-message-error'
                    : message.type === 'success'
                      ? 'account-message-success'
                      : ''
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
