import { isSupabaseConfigured, supabase } from './supabase'
import { mediaBucket } from './media'

const eventColumns = [
  'id',
  'slug',
  'title',
  'category',
  'summary',
  'description',
  'venue',
  'starts_at',
  'ends_at',
  'registration_url',
  'image_path',
  'image_alt',
  'show_in_gallery',
  'status',
  'is_featured',
  'published_at',
  'created_by',
  'created_at',
  'updated_at',
].join(', ')

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'Asia/Manila',
})

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila',
})

function getPublicEventImageUrl(path) {
  if (!path || !supabase) return null
  if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) return path

  return supabase.storage.from(mediaBucket).getPublicUrl(path).data.publicUrl
}

export const eventCategories = [
  'Academic',
  'Competition',
  'General Assembly',
  'Meeting',
  'Outreach',
  'Social',
  'Training',
  'Workshop',
]

export function getEventTiming(event, now = new Date()) {
  if (event.status === 'cancelled') return 'cancelled'

  const startsAt = new Date(event.starts_at)
  const endsAt = event.ends_at ? new Date(event.ends_at) : startsAt

  if (endsAt < now) return 'completed'
  return 'upcoming'
}

export function normalizeEvent(row) {
  const startsAt = new Date(row.starts_at)
  const endsAt = row.ends_at ? new Date(row.ends_at) : null

  return {
    ...row,
    databaseId: row.id,
    id: row.slug,
    date: dateFormatter.format(startsAt),
    time: endsAt
      ? `${timeFormatter.format(startsAt)} - ${timeFormatter.format(endsAt)}`
      : timeFormatter.format(startsAt),
    image: getPublicEventImageUrl(row.image_path),
    imageAlt: row.image_alt || `${row.title} event photo`,
    isFeatured: row.is_featured,
    showInGallery: row.show_in_gallery,
    timing: getEventTiming(row),
  }
}

export function isEventsTableMissing(error) {
  return ['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error?.code)
}

export async function getPublicEvents() {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('events')
    .select(eventColumns)
    .in('status', ['published', 'cancelled'])
    .lte('published_at', new Date().toISOString())
    .order('is_featured', { ascending: false })
    .order('starts_at', { ascending: true })

  return {
    data: data?.map(normalizeEvent) ?? null,
    error,
  }
}

export async function getAdminEvents() {
  const { data, error } = await supabase
    .from('events')
    .select(eventColumns)
    .order('starts_at', { ascending: false })

  return { data: data ?? null, error }
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
}

async function createAvailableSlug(title) {
  const baseSlug = slugify(title) || 'event'
  const { data } = await supabase
    .from('events')
    .select('slug')
    .eq('slug', baseSlug)
    .maybeSingle()

  if (!data) return baseSlug
  return `${baseSlug}-${Date.now().toString(36).slice(-6)}`
}

function toEventPayload(values, imagePath, publishedAt) {
  const isPublic = ['published', 'cancelled'].includes(values.status)

  return {
    title: values.title.trim(),
    category: values.category,
    summary: values.summary.trim(),
    description: values.description.trim(),
    venue: values.venue.trim(),
    starts_at: new Date(values.startsAt).toISOString(),
    ends_at: values.endsAt
      ? new Date(values.endsAt).toISOString()
      : null,
    registration_url: values.registrationUrl.trim() || null,
    image_path: imagePath || null,
    image_alt: values.imageAlt?.trim() || '',
    show_in_gallery: Boolean(values.showInGallery),
    status: values.status,
    is_featured: values.isFeatured,
    published_at: isPublic
      ? publishedAt || new Date().toISOString()
      : publishedAt,
  }
}

export async function createEvent(values, imagePath = null) {
  const slug = await createAvailableSlug(values.title)

  return supabase
    .from('events')
    .insert({
      ...toEventPayload(values, imagePath, null),
      slug,
    })
    .select(eventColumns)
    .single()
}

export async function updateEvent(id, values, imagePath, publishedAt) {
  return supabase
    .from('events')
    .update(toEventPayload(values, imagePath, publishedAt))
    .eq('id', id)
    .select(eventColumns)
    .single()
}

export async function deleteEvent(id) {
  return supabase.from('events').delete().eq('id', id)
}
