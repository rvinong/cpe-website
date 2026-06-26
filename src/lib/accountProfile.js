import { supabase } from './supabase'

export const profileAvatarBucket = 'profile-avatars'
export const maxProfileAvatarSize = 5 * 1024 * 1024

const legacyAvatarBuckets = ['staff-avatars']
const acceptedAvatarTypes = ['image/jpeg', 'image/png', 'image/webp']

export function isAccountProfileSchemaMissing(error) {
  const message = error?.message?.toLowerCase() || ''

  return (
    ['42883', 'PGRST202', 'PGRST204', '404'].includes(error?.code) ||
    message.includes('update_my_account_profile') ||
    message.includes('profile-avatars') ||
    message.includes('nickname')
  )
}

export function getFriendlyAccountProfileError(error) {
  if (isAccountProfileSchemaMissing(error)) {
    return 'One database step is still required. Run supabase/account_profiles.sql in the Supabase SQL Editor, then refresh this page.'
  }

  return error?.message || 'Profile could not be updated.'
}

export function getDisplayName(profile, user, fallback = 'Member') {
  return (
    profile?.nickname?.trim() ||
    profile?.full_name?.trim() ||
    user?.email?.split('@')[0] ||
    fallback
  )
}

export function getInitials(name, fallback = 'M') {
  const initials = (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return initials || fallback
}

export function validateProfileAvatar(file) {
  if (!file) return ''
  if (!acceptedAvatarTypes.includes(file.type)) {
    return 'Use a JPG, PNG, or WebP image.'
  }
  if (file.size > maxProfileAvatarSize) {
    return 'Profile photos must be 5 MB or smaller.'
  }
  return ''
}

function sanitizeFilename(filename) {
  const extension = filename.split('.').pop()?.toLowerCase() || 'jpg'
  const base = filename
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

  return `${base || 'avatar'}.${extension}`
}

export async function uploadProfileAvatar(file, userId) {
  const fileError = validateProfileAvatar(file)
  if (fileError) return { data: null, error: new Error(fileError) }

  const path = `${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizeFilename(file.name)}`
  return supabase.storage.from(profileAvatarBucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
}

export function removeProfileAvatar(path) {
  if (!path) return { data: null, error: null }
  return supabase.storage.from(profileAvatarBucket).remove([path])
}

export function updateMyAccountProfile({ nickname, avatarPath }) {
  return supabase.rpc('update_my_account_profile', {
    target_nickname: nickname || '',
    target_avatar_path: avatarPath || null,
  })
}

async function createSignedAvatarUrl(bucket, path) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60)

  return { data: data?.signedUrl || null, error }
}

export async function getProfileAvatarUrlCandidates(path) {
  if (!path) return { data: null, error: null }

  let firstError = null
  const urls = []
  const buckets = [profileAvatarBucket, ...legacyAvatarBuckets]

  for (const bucket of buckets) {
    const result = await createSignedAvatarUrl(bucket, path)
    if (result.data) urls.push(result.data)
    if (!firstError && result.error) firstError = result.error
  }

  return { data: urls, error: urls.length ? null : firstError }
}

export async function getProfileAvatarUrl(path) {
  const { data, error } = await getProfileAvatarUrlCandidates(path)

  return {
    data: data?.[0] || null,
    error,
  }
}
