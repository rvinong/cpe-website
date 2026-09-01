import { useCallback, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import AuthContext from './auth-context'

const dashboardRoles = new Set(['admin', 'editor'])
const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/+$/, '')
const profileColumns =
  'id, full_name, nickname, student_number, year_level, role, status, avatar_path'
const profileColumnsWithoutYearLevel =
  'id, full_name, nickname, student_number, role, status, avatar_path'
const legacyProfileColumns =
  'id, full_name, student_number, role, status, avatar_path'

function isProfileColumnMissing(error, column) {
  const message = error?.message?.toLowerCase() || ''

  return (
    (error?.code === '42703' || error?.code === 'PGRST204') &&
    message.includes(column)
  )
}

function getAuthRedirectUrl() {
  const siteUrl = configuredSiteUrl || window.location.origin
  return `${siteUrl}/account`
}

function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [profileError, setProfileError] = useState('')

  const loadProfile = useCallback(async (user) => {
    if (!supabase || !user) {
      setProfile(null)
      setProfileError('')
      return null
    }

    let { data, error } = await supabase
      .from('profiles')
      .select(profileColumns)
      .eq('id', user.id)
      .maybeSingle()

    if (error && isProfileColumnMissing(error, 'year_level')) {
      const fallbackResult = await supabase
        .from('profiles')
        .select(profileColumnsWithoutYearLevel)
        .eq('id', user.id)
        .maybeSingle()

      data = fallbackResult.data
      error = fallbackResult.error
      if (data) data = { ...data, year_level: '' }
    }

    if (error && isProfileColumnMissing(error, 'nickname')) {
      const fallbackResult = await supabase
        .from('profiles')
        .select(legacyProfileColumns)
        .eq('id', user.id)
        .maybeSingle()

      data = fallbackResult.data
      error = fallbackResult.error
      if (data) data = { ...data, nickname: '', year_level: '' }
    }

    if (error) {
      setProfile(null)
      setProfileError(error.message)
      return null
    }

    setProfile(data)
    setProfileError('')
    return data
  }, [])

  useEffect(() => {
    if (!supabase) return undefined

    let isMounted = true

    const initializeSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (!isMounted) return

      setSession(currentSession)
      if (currentSession?.user) {
        await loadProfile(currentSession.user)
      }

      if (isMounted) setIsLoading(false)
    }

    initializeSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return

      setSession(nextSession)
      if (nextSession?.user) {
        window.setTimeout(() => loadProfile(nextSession.user), 0)
      } else {
        setProfile(null)
        setProfileError('')
      }
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = async ({ email, password }) => {
    if (!supabase) {
      return {
        data: null,
        error: new Error('Supabase is not configured yet.'),
      }
    }

    return supabase.auth.signInWithPassword({ email, password })
  }

  const signUp = async ({
    email,
    password,
    accountType = 'student',
    fullName,
    studentNumber,
    yearLevel,
  }) => {
    if (!supabase) {
      return {
        data: null,
        error: new Error('Supabase is not configured yet.'),
      }
    }

    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
        data: {
          account_type: accountType,
          full_name: fullName,
          student_number: studentNumber,
          year_level: yearLevel,
        },
      },
    })
  }

  const signOut = async () => {
    if (!supabase) return { error: null }
    return supabase.auth.signOut()
  }

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      profileError,
      isLoading,
      isConfigured: isSupabaseConfigured,
      isApprovedMember: profile?.status === 'approved',
      canAccessAdmin:
        profile?.status === 'approved' && dashboardRoles.has(profile?.role),
      signIn,
      signUp,
      signOut,
      refreshProfile: () => loadProfile(session?.user),
    }),
    [
      isLoading,
      loadProfile,
      profile,
      profileError,
      session,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
