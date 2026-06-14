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
  if (!path || !supabase) return null
  return supabase.storage.from(mediaBucket).getPublicUrl(path).data.publicUrl
}

export function normalizeAlumniProfile(row) {
  return {
    ...row,
    role: row.professional_role,
    history: row.organization_history,
    photo: getPhotoUrl(row.photo_path),
    initials: getInitials(row.name),
    featured: row.is_featured,
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
    .lte('published_at', new Date().toISOString())
    .order('is_featured', { ascending: false })
    .order('batch', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  return { data: data?.map(normalizeAlumniProfile) ?? null, error }
}

export async function getAdminAlumni() {
  return supabase
    .from('alumni_profiles')
    .select(alumniColumns)
    .order('updated_at', { ascending: false })
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
    sort_order: Number(values.sortOrder) || 0,
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
