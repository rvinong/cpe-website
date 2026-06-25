import { isSupabaseConfigured, supabase } from './supabase'

export const mediaBucket = 'organization-media'
export const maxMediaFileSize = 8 * 1024 * 1024
export const maxNewsImages = 10
export const acceptedMediaTypes = ['image/jpeg', 'image/png', 'image/webp']

export const newsReactionTypes = [
  { id: 'like', label: 'Like' },
  { id: 'love', label: 'Love' },
  { id: 'celebrate', label: 'Celebrate' },
  { id: 'wow', label: 'Wow' },
  { id: 'support', label: 'Support' },
]

const baseNewsColumns = [
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

const newsImageColumns = [
  'news_post_id',
  'id',
  'image_path',
  'alt_text',
  'caption',
  'sort_order',
  'created_at',
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

function createDefaultReactionSummary() {
  const counts = Object.fromEntries(
    newsReactionTypes.map(({ id }) => [id, 0]),
  )

  return {
    counts,
    total: 0,
    userReaction: '',
  }
}

function getPublicImageUrl(path) {
  if (!path || !supabase) return null
  if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) return path

  return supabase.storage.from(mediaBucket).getPublicUrl(path).data.publicUrl
}

function normalizeReactionSummary(rows = []) {
  const summary = createDefaultReactionSummary()

  rows.forEach((row) => {
    if (!row?.reaction_type) return
    summary.counts[row.reaction_type] = Number(row.total) || 0
    if (row.user_reaction) summary.userReaction = row.user_reaction
  })

  summary.total = Object.values(summary.counts).reduce(
    (total, count) => total + count,
    0,
  )

  return summary
}

function normalizeNewsImages(row) {
  const relatedImages = Array.isArray(row.news_post_images)
    ? row.news_post_images
    : []
  const images = relatedImages
    .filter((image) => image?.image_path)
    .sort(
      (first, second) =>
        (Number(first.sort_order) || 0) - (Number(second.sort_order) || 0),
    )

  if (images.length === 0 && row.image_path) {
    images.push({
      id: `legacy-${row.id}`,
      image_path: row.image_path,
      alt_text: row.image_alt || '',
      caption: '',
      sort_order: 0,
      created_at: row.created_at,
    })
  }

  return images.map((image, index) => ({
    ...image,
    sort_order: Number(image.sort_order) || index,
    imagePath: image.image_path,
    altText: image.alt_text || '',
    image: getPublicImageUrl(image.image_path),
  }))
}

export function normalizeNewsPost(row, reactionSummary) {
  const images = normalizeNewsImages(row)
  const coverImage = images[0]
  const reactions = reactionSummary || createDefaultReactionSummary()

  return {
    ...row,
    date: dateFormatter.format(new Date(row.published_at || row.created_at)),
    images,
    image: coverImage?.image || getPublicImageUrl(row.image_path),
    imageAlt: coverImage?.altText || row.image_alt,
    isFeatured: row.is_featured,
    reactions,
    reactionTotal: reactions.total,
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
  return [
    '42P01',
    '42703',
    '42883',
    'PGRST200',
    'PGRST202',
    'PGRST204',
    'PGRST205',
    '404',
  ].includes(error?.code)
}

function isNewsImagesUnavailable(error) {
  const message = error?.message || ''

  return (
    isMediaSchemaMissing(error) ||
    message.includes('news_post_images') ||
    message.includes('news_posts')
  )
}

export function getFriendlyReactionError(error) {
  const message = error?.message || ''
  const isSchemaCacheError =
    isMediaSchemaMissing(error) ||
    message.includes('schema cache') ||
    message.includes('get_news_reaction_summary') ||
    message.includes('set_news_reaction') ||
    message.includes('clear_news_reaction') ||
    message.includes('get_news_reaction_members')

  return isSchemaCacheError
    ? 'Reactions are being set up. Run the updated supabase/media.sql, then try again.'
    : message || 'Could not update reactions right now.'
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

async function getReactionSummaryRows(newsPostId) {
  if (!isSupabaseConfigured) return { data: [], error: null }

  const { data, error } = await supabase.rpc('get_news_reaction_summary', {
    selected_news_post_id: newsPostId,
  })

  return { data: data || [], error }
}

async function hydrateNewsReactionSummaries(posts) {
  if (!posts?.length) return posts

  const summaries = await Promise.all(
    posts.map((post) => getReactionSummaryRows(post.id)),
  )

  return posts.map((post, index) => {
    const { data, error } = summaries[index]
    const reactions = error
      ? createDefaultReactionSummary()
      : normalizeReactionSummary(data)

    return {
      ...post,
      reactions,
      reactionTotal: reactions.total,
    }
  })
}

async function getAdminNewsPostById(id) {
  const { data, error } = await supabase
    .from('news_posts')
    .select(baseNewsColumns)
    .eq('id', id)
    .single()

  if (error || !data) return { data: null, error }

  const [post] = await attachNewsImages([data])
  return { data: normalizeNewsPost(post), error: null }
}

async function attachNewsImages(posts) {
  if (!posts?.length) return posts

  const ids = posts.map((post) => post.id)
  const { data, error } = await supabase
    .from('news_post_images')
    .select(newsImageColumns)
    .in('news_post_id', ids)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return posts

  const imagesByPostId = new Map()

  data?.forEach((image) => {
    const current = imagesByPostId.get(image.news_post_id) || []
    current.push(image)
    imagesByPostId.set(image.news_post_id, current)
  })

  return posts.map((post) => ({
    ...post,
    news_post_images: imagesByPostId.get(post.id) || [],
  }))
}

export async function getPublicNews(limit) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  let query = supabase
    .from('news_posts')
    .select(baseNewsColumns)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })

  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) return { data: null, error }

  const rows = await attachNewsImages(data || [])
  const posts = rows.map((row) => normalizeNewsPost(row))
  return { data: await hydrateNewsReactionSummaries(posts), error: null }
}

export async function getPublicNewsBySlug(slug) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('news_posts')
    .select(baseNewsColumns)
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .maybeSingle()

  if (error || !data) return { data: null, error }

  const [row] = await attachNewsImages([data])
  const [post] = await hydrateNewsReactionSummaries([normalizeNewsPost(row)])
  return { data: post, error: null }
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
  const { data, error } = await supabase
    .from('news_posts')
    .select(baseNewsColumns)
    .order('updated_at', { ascending: false })

  if (error) return { data: null, error }

  const rows = await attachNewsImages(data || [])
  return { data: rows.map((row) => normalizeNewsPost(row)), error: null }
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

function toNewsPayload(values, coverImage, publishedAt) {
  return {
    title: values.title.trim(),
    category: values.category,
    summary: values.summary.trim(),
    body: values.body.trim(),
    image_path: coverImage?.imagePath || null,
    image_alt: coverImage?.altText?.trim() || '',
    status: values.status,
    is_featured: values.isFeatured,
    published_at:
      values.status === 'published'
        ? publishedAt || new Date().toISOString()
        : publishedAt,
  }
}

function toNewsImagePayload(newsPostId, image, index) {
  return {
    news_post_id: newsPostId,
    image_path: image.imagePath,
    alt_text: image.altText.trim(),
    caption: image.caption?.trim() || '',
    sort_order: index,
  }
}

async function replaceNewsImages(newsPostId, images) {
  const deleteResult = await supabase
    .from('news_post_images')
    .delete()
    .eq('news_post_id', newsPostId)

  if (deleteResult.error) {
    if (isNewsImagesUnavailable(deleteResult.error) && images.length <= 1) {
      return { data: [], error: null }
    }

    return deleteResult
  }

  const payload = images.map((image, index) =>
    toNewsImagePayload(newsPostId, image, index),
  )

  if (payload.length === 0) return { data: [], error: null }

  const insertResult = await supabase.from('news_post_images').insert(payload)

  if (
    insertResult.error &&
    isNewsImagesUnavailable(insertResult.error) &&
    images.length <= 1
  ) {
    return { data: [], error: null }
  }

  return insertResult
}

export async function createNewsPost(values, images = []) {
  const slug = await createAvailableNewsSlug(values.title)
  const coverImage = images[0] || null

  const insertResult = await supabase
    .from('news_posts')
    .insert({
      ...toNewsPayload(values, coverImage, null),
      slug,
    })
    .select(baseNewsColumns)
    .single()

  if (insertResult.error) return insertResult

  const imageResult = await replaceNewsImages(insertResult.data.id, images)
  if (imageResult.error) {
    await supabase.from('news_posts').delete().eq('id', insertResult.data.id)
    return { data: null, error: imageResult.error }
  }

  return getAdminNewsPostById(insertResult.data.id)
}

export async function updateNewsPost(
  id,
  values,
  images = [],
  publishedAt,
) {
  const coverImage = images[0] || null
  const updateResult = await supabase
    .from('news_posts')
    .update(toNewsPayload(values, coverImage, publishedAt))
    .eq('id', id)
    .select(baseNewsColumns)
    .single()

  if (updateResult.error) return updateResult

  const imageResult = await replaceNewsImages(id, images)
  if (imageResult.error) return { data: null, error: imageResult.error }

  return getAdminNewsPostById(id)
}

export async function deleteNewsPost(id) {
  return supabase.from('news_posts').delete().eq('id', id)
}

export async function getNewsReactionSummary(newsPostId) {
  const { data, error } = await getReactionSummaryRows(newsPostId)
  return {
    data: error ? createDefaultReactionSummary() : normalizeReactionSummary(data),
    error,
  }
}

export async function setNewsReaction(newsPostId, reactionType) {
  const { data, error } = await supabase.rpc('set_news_reaction', {
    selected_news_post_id: newsPostId,
    selected_reaction_type: reactionType,
  })

  return {
    data: error ? null : normalizeReactionSummary(data),
    error,
  }
}

export async function clearNewsReaction(newsPostId) {
  const { data, error } = await supabase.rpc('clear_news_reaction', {
    selected_news_post_id: newsPostId,
  })

  return {
    data: error ? null : normalizeReactionSummary(data),
    error,
  }
}

export async function getNewsReactionMembers(newsPostId, reactionType) {
  return supabase.rpc('get_news_reaction_members', {
    selected_news_post_id: newsPostId,
    selected_reaction_type: reactionType,
  })
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
