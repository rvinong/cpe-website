import { isSupabaseConfigured, supabase } from './supabase'

export const mediaBucket = 'organization-media'
export const maxMediaFileSize = 8 * 1024 * 1024
export const acceptedMediaTypes = ['image/jpeg', 'image/png', 'image/webp']

const newsColumns = [
  'id',
  'slug',
  'title',
  'category',
  'summary',
  'body',
  'image_path',
  'image_alt',
  'status',
  'is_featured',
  'published_at',
  'created_at',
  'updated_at',
].join(', ')

const galleryColumns = [
  'id',
  'album',
  'category',
  'description',
  'alt_text',
  'image_path',
  'captured_on',
  'status',
  'sort_order',
  'created_at',
  'updated_at',
].join(', ')

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'Asia/Manila',
})

export const newsCategories = [
  'Achievements',
  'Activities',
  'Community',
  'Organization',
  'Partnerships',
  'Student Spotlight',
]

export const galleryCategories = [
  'Academic',
  'Competitions',
  'Meetings',
  'Outreach',
  'Social',
  'Training',
  'Workshops',
]

function getPublicImageUrl(path) {
  if (!path) return null

  return supabase.storage.from(mediaBucket).getPublicUrl(path).data.publicUrl
}

export function normalizeNewsPost(row) {
  return {
    ...row,
    date: dateFormatter.format(
      new Date(row.published_at || row.created_at),
    ),
    image: getPublicImageUrl(row.image_path),
    imageAlt: row.image_alt,
    isFeatured: row.is_featured,
  }
}

export function normalizeGalleryPhoto(row) {
  const capturedOn = new Date(`${row.captured_on}T00:00:00+08:00`)

  return {
    ...row,
    image: getPublicImageUrl(row.image_path),
    alt: row.alt_text,
    date: dateFormatter.format(capturedOn),
    year: capturedOn.getFullYear(),
  }
}

export function isMediaSchemaMissing(error) {
  return ['42P01', 'PGRST204', 'PGRST205', '404'].includes(error?.code)
}

export function validateMediaFile(file) {
  if (!file) return ''
  if (!acceptedMediaTypes.includes(file.type)) {
    return 'Use a JPG, PNG, or WebP image.'
  }
  if (file.size > maxMediaFileSize) {
    return 'Images must be 8 MB or smaller.'
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
    .slice(0, 48)

  return `${base || 'image'}.${extension}`
}

export async function uploadMedia(file, folder) {
  const fileError = validateMediaFile(file)
  if (fileError) return { data: null, error: new Error(fileError) }

  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizeFilename(file.name)}`
  const { data, error } = await supabase.storage
    .from(mediaBucket)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

  return { data, error }
}

export async function removeMedia(path) {
  if (!path) return { data: null, error: null }
  return supabase.storage.from(mediaBucket).remove([path])
}

export async function getPublicNews(limit) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  let query = supabase
    .from('news_posts')
    .select(newsColumns)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })

  if (limit) query = query.limit(limit)

  const { data, error } = await query
  return { data: data?.map(normalizeNewsPost) ?? null, error }
}

export async function getPublicGalleryPhotos() {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('gallery_photos')
    .select(galleryColumns)
    .eq('status', 'published')
    .order('captured_on', { ascending: false })
    .order('sort_order', { ascending: true })

  return { data: data?.map(normalizeGalleryPhoto) ?? null, error }
}

export async function getAdminNews() {
  return supabase
    .from('news_posts')
    .select(newsColumns)
    .order('updated_at', { ascending: false })
}

export async function getAdminGalleryPhotos() {
  return supabase
    .from('gallery_photos')
    .select(galleryColumns)
    .order('captured_on', { ascending: false })
    .order('sort_order', { ascending: true })
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
}

async function createAvailableNewsSlug(title) {
  const baseSlug = slugify(title) || 'news'
  const { data } = await supabase
    .from('news_posts')
    .select('slug')
    .eq('slug', baseSlug)
    .maybeSingle()

  if (!data) return baseSlug
  return `${baseSlug}-${Date.now().toString(36).slice(-6)}`
}

function toNewsPayload(values, imagePath, publishedAt) {
  return {
    title: values.title.trim(),
    category: values.category,
    summary: values.summary.trim(),
    body: values.body.trim(),
    image_path: imagePath,
    image_alt: values.imageAlt.trim(),
    status: values.status,
    is_featured: values.isFeatured,
    published_at:
      values.status === 'published'
        ? publishedAt || new Date().toISOString()
        : publishedAt,
  }
}

export async function createNewsPost(values, imagePath) {
  const slug = await createAvailableNewsSlug(values.title)

  return supabase
    .from('news_posts')
    .insert({
      ...toNewsPayload(values, imagePath, null),
      slug,
    })
    .select(newsColumns)
    .single()
}

export async function updateNewsPost(
  id,
  values,
  imagePath,
  publishedAt,
) {
  return supabase
    .from('news_posts')
    .update(toNewsPayload(values, imagePath, publishedAt))
    .eq('id', id)
    .select(newsColumns)
    .single()
}

export async function deleteNewsPost(id) {
  return supabase.from('news_posts').delete().eq('id', id)
}

function toGalleryPayload(values, imagePath) {
  return {
    album: values.album.trim(),
    category: values.category,
    description: values.description.trim(),
    alt_text: values.altText.trim(),
    image_path: imagePath,
    captured_on: values.capturedOn,
    status: values.status,
    sort_order: Number(values.sortOrder) || 0,
  }
}

export async function createGalleryPhoto(values, imagePath) {
  return supabase
    .from('gallery_photos')
    .insert(toGalleryPayload(values, imagePath))
    .select(galleryColumns)
    .single()
}

export async function updateGalleryPhoto(id, values, imagePath) {
  return supabase
    .from('gallery_photos')
    .update(toGalleryPayload(values, imagePath))
    .eq('id', id)
    .select(galleryColumns)
    .single()
}

export async function deleteGalleryPhoto(id) {
  return supabase.from('gallery_photos').delete().eq('id', id)
}
