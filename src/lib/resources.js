import { supabase } from './supabase'
import { getSafeHttpUrl, isSafeStoragePath } from './safeUrl'

export const resourcesBucket = 'student-resources'
export const maxResourceFileSize = 20 * 1024 * 1024
export const acceptedResourceTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'text/plain',
]

const resourceColumns = [
  'id',
  'title',
  'category',
  'description',
  'course_code',
  'academic_year',
  'file_path',
  'file_name',
  'file_size',
  'mime_type',
  'external_url',
  'status',
  'sort_order',
  'created_at',
  'updated_at',
].join(', ')

export function isResourcesSchemaMissing(error) {
  return ['42P01', 'PGRST204', 'PGRST205', '404'].includes(error?.code)
}

export function validateResourceFile(file) {
  if (!file) return ''
  if (!acceptedResourceTypes.includes(file.type)) {
    return 'Use a PDF, Word, PowerPoint, Excel, ZIP, or text file.'
  }
  if (file.size > maxResourceFileSize) {
    return 'Files must be 20 MB or smaller.'
  }
  return ''
}

function sanitizeFilename(filename) {
  const extension = filename.split('.').pop()?.toLowerCase() || 'file'
  const base = filename
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)

  return `${base || 'resource'}.${extension}`
}

export async function uploadResource(file) {
  const fileError = validateResourceFile(file)
  if (fileError) return { data: null, error: new Error(fileError) }

  const path = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizeFilename(file.name)}`
  return supabase.storage.from(resourcesBucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
}

export async function removeResource(path) {
  if (!path) return { data: null, error: null }
  return supabase.storage.from(resourcesBucket).remove([path])
}

function isPdfResource(resource) {
  const mimeType = String(resource?.mime_type || resource?.mimeType || '')
    .trim()
    .toLowerCase()
  const fileName = String(resource?.file_name || resource?.fileName || '')

  return mimeType === 'application/pdf' || /\.pdf$/i.test(fileName)
}

export async function createResourceDownload(resource) {
  if (resource.external_url) {
    const externalUrl = getSafeHttpUrl(resource.external_url)
    if (!externalUrl) {
      return {
        data: null,
        error: new Error('This resource has an invalid external link.'),
      }
    }

    return { data: { signedUrl: externalUrl }, error: null }
  }

  if (!isSafeStoragePath(resource.file_path)) {
    return {
      data: null,
      error: new Error('This resource has an invalid file path.'),
    }
  }

  const bucket = supabase.storage.from(resourcesBucket)

  if (isPdfResource(resource)) {
    return bucket.createSignedUrl(resource.file_path, 60)
  }

  return bucket.createSignedUrl(resource.file_path, 60, {
    download: resource.file_name || resource.title,
  })
}

export async function getPublishedResources() {
  return supabase
    .from('student_resources')
    .select(resourceColumns)
    .eq('status', 'published')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true })
}

export async function getAdminResources() {
  return supabase
    .from('student_resources')
    .select(resourceColumns)
    .order('updated_at', { ascending: false })
}

function toPayload(values, file) {
  return {
    title: values.title.trim(),
    category: values.category,
    description: values.description.trim(),
    course_code: values.courseCode.trim(),
    academic_year: values.academicYear.trim(),
    file_path: file?.path || null,
    file_name: file?.name || null,
    file_size: file?.size || null,
    mime_type: file?.type || null,
    external_url: getSafeHttpUrl(values.externalUrl) || null,
    status: values.status,
    sort_order: Number(values.sortOrder) || 0,
  }
}

export async function createResource(values, file) {
  if (values.externalUrl.trim() && !getSafeHttpUrl(values.externalUrl)) {
    return {
      data: null,
      error: new Error('External resource links must use http:// or https://.'),
    }
  }

  return supabase
    .from('student_resources')
    .insert(toPayload(values, file))
    .select(resourceColumns)
    .single()
}

export async function updateResource(id, values, file) {
  if (values.externalUrl.trim() && !getSafeHttpUrl(values.externalUrl)) {
    return {
      data: null,
      error: new Error('External resource links must use http:// or https://.'),
    }
  }

  return supabase
    .from('student_resources')
    .update(toPayload(values, file))
    .eq('id', id)
    .select(resourceColumns)
    .single()
}

export async function deleteResource(id) {
  return supabase.from('student_resources').delete().eq('id', id)
}

export function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
