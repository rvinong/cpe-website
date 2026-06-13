import { isSupabaseConfigured, supabase } from './supabase'

const announcementColumns = [
  'id',
  'slug',
  'title',
  'category',
  'summary',
  'body',
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
})

export function normalizeAnnouncement(row) {
  return {
    ...row,
    id: row.slug,
    databaseId: row.id,
    body: row.body
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
    date: dateFormatter.format(
      new Date(row.published_at || row.created_at),
    ),
    isFeatured: row.is_featured,
  }
}

export function isAnnouncementsTableMissing(error) {
  return ['42P01', 'PGRST204', 'PGRST205'].includes(error?.code)
}

export async function getPublicAnnouncements(limit) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  let query = supabase
    .from('announcements')
    .select(announcementColumns)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })

  if (limit) query = query.limit(limit)

  const { data, error } = await query
  return {
    data: data?.map(normalizeAnnouncement) ?? null,
    error,
  }
}

export async function getPublicAnnouncement(slug) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('announcements')
    .select(announcementColumns)
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .maybeSingle()

  return {
    data: data ? normalizeAnnouncement(data) : null,
    error,
  }
}

export async function getAdminAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select(announcementColumns)
    .order('updated_at', { ascending: false })

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
  const baseSlug = slugify(title) || 'announcement'
  const { data } = await supabase
    .from('announcements')
    .select('slug')
    .eq('slug', baseSlug)
    .maybeSingle()

  if (!data) return baseSlug
  return `${baseSlug}-${Date.now().toString(36).slice(-6)}`
}

function toAnnouncementPayload(values, publishedAt) {
  const status = values.status

  return {
    title: values.title.trim(),
    category: values.category,
    summary: values.summary.trim(),
    body: values.body.trim(),
    status,
    is_featured: values.isFeatured,
    published_at:
      status === 'published'
        ? publishedAt || new Date().toISOString()
        : publishedAt,
  }
}

export async function createAnnouncement(values) {
  const slug = await createAvailableSlug(values.title)
  const payload = {
    ...toAnnouncementPayload(values, null),
    slug,
  }

  return supabase
    .from('announcements')
    .insert(payload)
    .select(announcementColumns)
    .single()
}

export async function updateAnnouncement(id, values, publishedAt) {
  return supabase
    .from('announcements')
    .update(toAnnouncementPayload(values, publishedAt))
    .eq('id', id)
    .select(announcementColumns)
    .single()
}

export async function deleteAnnouncement(id) {
  return supabase.from('announcements').delete().eq('id', id)
}
