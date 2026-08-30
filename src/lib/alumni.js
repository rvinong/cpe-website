import {
  mediaBucket,
  removeMedia,
  uploadMedia,
  validateMediaFile,
} from './media'
import { isSupabaseConfigured, supabase } from './supabase'

const alumniColumns = [
  'id',
  'name',
  'batch',
  'professional_role',
  'organization',
  'organization_history',
  'highlight',
  'photo_path',
  'status',
  'is_featured',
  'consent_confirmed',
  'sort_order',
  'published_at',
  'created_at',
  'updated_at',
].join(', ')

const alumniLeadershipColumns = [
  'id',
  'alumni_profile_id',
  'organization',
  'position',
  'category',
  'term',
  'description',
  'sort_order',
  'created_at',
  'updated_at',
].join(', ')

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function getPhotoUrl(path) {
  if (!path) return null
  if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) return path
  if (!supabase) return null
  return supabase.storage.from(mediaBucket).getPublicUrl(path).data.publicUrl
}

function normalizeAlumniLeadership(row) {
  return {
    ...row,
    organization: row.organization || '',
    position: row.position || '',
    category: row.category || 'Student Organization',
    term: row.term || '',
    description: row.description || '',
  }
}

function groupLeadershipByProfile(entries) {
  return entries.reduce((groups, entry) => {
    const profileId = entry.alumni_profile_id
    if (!groups[profileId]) groups[profileId] = []
    groups[profileId].push(entry)
    return groups
  }, {})
}

export function normalizeAlumniProfile(row) {
  return {
    ...row,
    role: row.professional_role,
    history: row.organization_history,
    photo: getPhotoUrl(row.photo_path),
    initials: getInitials(row.name),
    featured: row.is_featured,
    leadership: Array.isArray(row.leadership)
      ? row.leadership.map(normalizeAlumniLeadership)
      : [],
  }
}

export function isAlumniSchemaMissing(error) {
  return ['42P01', 'PGRST204', 'PGRST205', '404'].includes(error?.code)
}

export async function getPublicAlumni() {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('alumni_profiles')
    .select(alumniColumns)
    .eq('status', 'published')
    .eq('consent_confirmed', true)
    .lte('published_at', new Date().toISOString())
    .order('is_featured', { ascending: false })
    .order('batch', { ascending: false })
    .order('name', { ascending: true })

  if (error || !data) return { data: null, error }

  const profiles = data.map(normalizeAlumniProfile)
  const profileIds = profiles.map((profile) => profile.id)

  if (profileIds.length === 0) return { data: profiles, error: null }

  const leadershipResult = await getPublicAlumniLeadership(profileIds)
  if (
    leadershipResult.error &&
    !isAlumniSchemaMissing(leadershipResult.error)
  ) {
    return { data: profiles, error: leadershipResult.error }
  }

  const leadershipByProfile = groupLeadershipByProfile(
    leadershipResult.data || [],
  )

  return {
    data: profiles.map((profile) => ({
      ...profile,
      leadership: leadershipByProfile[profile.id] || [],
    })),
    error: null,
  }
}

export async function getAdminAlumni() {
  return supabase
    .from('alumni_profiles')
    .select(alumniColumns)
    .order('name', { ascending: true })
}

export async function getPublicAlumniLeadership(profileIds) {
  const { data, error } = await supabase
    .from('alumni_leadership')
    .select(alumniLeadershipColumns)
    .in('alumni_profile_id', profileIds)
    .order('sort_order', { ascending: true })
    .order('organization', { ascending: true })
    .order('position', { ascending: true })

  return { data: data?.map(normalizeAlumniLeadership) ?? [], error }
}

export async function getAdminAlumniLeadership() {
  const { data, error } = await supabase
    .from('alumni_leadership')
    .select(alumniLeadershipColumns)
    .order('alumni_profile_id', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('organization', { ascending: true })
    .order('position', { ascending: true })

  return { data: data?.map(normalizeAlumniLeadership) ?? [], error }
}

export async function replaceAlumniLeadership(profileId, entries) {
  const cleanEntries = entries
    .filter(
      (entry) => entry.organization?.trim() && entry.position?.trim(),
    )
    .map((entry, index) => {
      const payload = {
        alumni_profile_id: profileId,
        organization: entry.organization.trim(),
        position: entry.position.trim(),
        category: entry.category?.trim() || 'Student Organization',
        term: entry.term?.trim() || '',
        description: entry.description?.trim() || '',
        sort_order: index,
      }

      if (entry.id) payload.id = entry.id
      return payload
    })

  const { data: existing, error: existingError } = await supabase
    .from('alumni_leadership')
    .select('id')
    .eq('alumni_profile_id', profileId)

  if (existingError) return { data: null, error: existingError }

  const { data: saved, error: saveError } = cleanEntries.length
    ? await supabase
        .from('alumni_leadership')
        .upsert(cleanEntries, { onConflict: 'id' })
        .select(alumniLeadershipColumns)
    : { data: [], error: null }

  if (saveError) return { data: null, error: saveError }

  const savedIds = new Set((saved || []).map((entry) => entry.id))
  const staleIds = (existing || [])
    .map((entry) => entry.id)
    .filter((id) => !savedIds.has(id))

  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('alumni_leadership')
      .delete()
      .eq('alumni_profile_id', profileId)
      .in('id', staleIds)

    if (deleteError) return { data: null, error: deleteError }
  }

  return {
    data: saved?.map(normalizeAlumniLeadership) || [],
    error: null,
  }
}

function toPayload(values, photoPath, publishedAt) {
  return {
    name: values.name.trim(),
    batch: values.batch.trim(),
    professional_role: values.role.trim(),
    organization: values.organization.trim(),
    organization_history: values.history.trim(),
    highlight: values.highlight.trim(),
    photo_path: photoPath,
    status: values.status,
    is_featured: values.isFeatured,
    consent_confirmed: values.consentConfirmed,
    published_at:
      values.status === 'published'
        ? publishedAt || new Date().toISOString()
        : publishedAt,
  }
}

export async function createAlumniProfile(values, photoPath) {
  return supabase
    .from('alumni_profiles')
    .insert(toPayload(values, photoPath, null))
    .select(alumniColumns)
    .single()
}

export async function updateAlumniProfile(
  id,
  values,
  photoPath,
  publishedAt,
) {
  return supabase
    .from('alumni_profiles')
    .update(toPayload(values, photoPath, publishedAt))
    .eq('id', id)
    .select(alumniColumns)
    .single()
}

export async function deleteAlumniProfile(id) {
  return supabase.from('alumni_profiles').delete().eq('id', id)
}

export function validateAlumniPhoto(file) {
  return validateMediaFile(file)
}

export function uploadAlumniPhoto(file) {
  return uploadMedia(file, 'alumni')
}

export function removeAlumniPhoto(path) {
  return removeMedia(path)
}
