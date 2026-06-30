import {
  internalAuditReports as fallbackAuditReports,
} from '../data/internalAudit'
import { isSupabaseConfigured, supabase } from './supabase'

export const auditReportsBucket = 'internal-audit-reports'
export const maxAuditReportFileSize = 20 * 1024 * 1024
export const acceptedAuditReportTypes = ['application/pdf']

const auditReportColumns = [
  'id',
  'slug',
  'title',
  'report_type',
  'period',
  'summary',
  'prepared_by',
  'reviewed_by',
  'approved_by',
  'resolution_number',
  'funds_received',
  'total_expenses',
  'remaining_balance',
  'file_path',
  'file_name',
  'file_size',
  'mime_type',
  'status',
  'is_featured',
  'sort_order',
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

const moneyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
}

function sanitizeFilename(filename) {
  const extension = filename.split('.').pop()?.toLowerCase() || 'pdf'
  const base = filename
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)

  return `${base || 'audit-report'}.${extension}`
}

function getDateLabel(value, fallback = 'For publication') {
  if (!value) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : dateFormatter.format(date)
}

function toNullableNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function getMoneyLabel(value) {
  if (value === null || value === undefined || value === '') return 'TBA'
  const number = Number(value)
  return Number.isFinite(number) ? `PHP ${moneyFormatter.format(number)}` : 'TBA'
}

export function formatAuditFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function normalizeAuditReport(row) {
  return {
    ...row,
    type: row.report_type || row.type,
    reportType: row.report_type || row.type,
    preparedBy: row.prepared_by || row.preparedBy || '',
    reviewedBy: row.reviewed_by || row.reviewedBy || '',
    approvedBy: row.approved_by || row.approvedBy || '',
    resolutionNumber: row.resolution_number || row.resolutionNumber || '',
    fundsReceived: getMoneyLabel(row.funds_received ?? row.fundsReceived),
    totalExpenses: getMoneyLabel(row.total_expenses ?? row.totalExpenses),
    remainingBalance: getMoneyLabel(
      row.remaining_balance ?? row.remainingBalance,
    ),
    rawFundsReceived: row.funds_received ?? '',
    rawTotalExpenses: row.total_expenses ?? '',
    rawRemainingBalance: row.remaining_balance ?? '',
    filePath: row.file_path || '',
    fileName: row.file_name || '',
    fileSize: row.file_size || 0,
    mimeType: row.mime_type || '',
    publishedAt: row.publishedAt || getDateLabel(row.published_at),
    publishedAtInput: row.published_at || '',
    isFeatured: Boolean(row.is_featured || row.isFeatured),
    sortOrder: Number(row.sort_order) || 0,
    highlights:
      row.highlights ||
      [
        'Approved document summary',
        'Prepared and reviewed record',
        'Publication-ready archive entry',
      ],
  }
}

export function isAuditReportsSchemaMissing(error) {
  return ['42P01', '42703', 'PGRST204', 'PGRST205', '404'].includes(
    error?.code,
  )
}

export function validateAuditReportFile(file) {
  if (!file) return ''
  if (!acceptedAuditReportTypes.includes(file.type)) {
    return 'Use a PDF file for internal audit reports.'
  }
  if (file.size > maxAuditReportFileSize) {
    return 'Audit report PDFs must be 20 MB or smaller.'
  }
  return ''
}

export async function uploadAuditReport(file) {
  const fileError = validateAuditReportFile(file)
  if (fileError) return { data: null, error: new Error(fileError) }

  const path = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizeFilename(file.name)}`
  return supabase.storage.from(auditReportsBucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
}

export async function removeAuditReportFile(path) {
  if (!path) return { data: null, error: null }
  return supabase.storage.from(auditReportsBucket).remove([path])
}

export async function createAuditReportDownload(report) {
  if (!report.file_path && !report.filePath) {
    return {
      data: null,
      error: new Error('No PDF file has been uploaded for this report yet.'),
    }
  }

  return supabase.storage
    .from(auditReportsBucket)
    .createSignedUrl(report.file_path || report.filePath, 60, {
      download: report.file_name || report.fileName || report.title,
    })
}

async function createAvailableSlug(title) {
  const baseSlug = slugify(title) || 'audit-report'
  const { data } = await supabase
    .from('audit_reports')
    .select('slug')
    .eq('slug', baseSlug)
    .maybeSingle()

  if (!data) return baseSlug
  return `${baseSlug}-${Date.now().toString(36).slice(-6)}`
}

function toAuditReportPayload(values, file, currentPublishedAt = null) {
  const isPublished = values.status === 'published'

  return {
    title: values.title.trim(),
    report_type: values.reportType,
    period: values.period.trim(),
    summary: values.summary.trim(),
    prepared_by: values.preparedBy.trim(),
    reviewed_by: values.reviewedBy.trim(),
    approved_by: values.approvedBy.trim(),
    resolution_number: values.resolutionNumber.trim(),
    funds_received: toNullableNumber(values.fundsReceived),
    total_expenses: toNullableNumber(values.totalExpenses),
    remaining_balance: toNullableNumber(values.remainingBalance),
    file_path: file?.path || null,
    file_name: file?.name || null,
    file_size: file?.size || null,
    mime_type: file?.type || null,
    status: values.status,
    is_featured: values.isFeatured,
    sort_order: Number(values.sortOrder) || 0,
    published_at: isPublished
      ? values.publishedAt
        ? new Date(values.publishedAt).toISOString()
        : currentPublishedAt || new Date().toISOString()
      : null,
  }
}

export async function getPublicAuditReports() {
  if (!isSupabaseConfigured) {
    return {
      data: fallbackAuditReports.map(normalizeAuditReport),
      error: null,
      source: 'fallback',
    }
  }

  const { data, error } = await supabase
    .from('audit_reports')
    .select(auditReportColumns)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })
    .order('sort_order', { ascending: true })

  if (error) {
    return {
      data: fallbackAuditReports.map(normalizeAuditReport),
      error,
      source: 'fallback',
    }
  }

  return { data: (data || []).map(normalizeAuditReport), error: null }
}

export async function getAdminAuditReports() {
  return supabase
    .from('audit_reports')
    .select(auditReportColumns)
    .order('updated_at', { ascending: false })
}

export async function createAuditReport(values, file) {
  const slug = await createAvailableSlug(values.title)

  return supabase
    .from('audit_reports')
    .insert({
      ...toAuditReportPayload(values, file),
      slug,
    })
    .select(auditReportColumns)
    .single()
}

export async function updateAuditReport(
  id,
  values,
  file,
  currentPublishedAt,
) {
  return supabase
    .from('audit_reports')
    .update(toAuditReportPayload(values, file, currentPublishedAt))
    .eq('id', id)
    .select(auditReportColumns)
    .single()
}

export async function deleteAuditReport(id) {
  return supabase.from('audit_reports').delete().eq('id', id)
}
