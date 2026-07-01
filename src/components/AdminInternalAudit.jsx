import {
  Archive,
  BadgeCheck,
  CalendarCheck,
  CirclePlus,
  ClipboardList,
  Download,
  Edit3,
  FileCheck2,
  FileText,
  LoaderCircle,
  ReceiptText,
  Save,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { internalAuditCategories } from '../data/internalAudit'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import {
  createAuditReport,
  createAuditReportDownload,
  deleteAuditReport,
  formatAuditFileSize,
  getAdminAuditReports,
  isAuditReportsSchemaMissing,
  removeAuditReportFile,
  updateAuditReport,
  uploadAuditReport,
  validateAuditReportFile,
} from '../lib/internalAudit'
import { signalBytePublished } from '../lib/byteAssistant'
import AdminListSkeleton from './AdminListSkeleton'

const emptyForm = {
  title: '',
  reportType: 'project_proposal',
  period: '',
  summary: '',
  preparedBy: '',
  reviewedBy: '',
  approvedBy: '',
  resolutionNumber: '',
  fundsReceived: '',
  totalExpenses: '',
  remainingBalance: '',
  publishedAt: '',
  status: 'draft',
  isFeatured: false,
  sortOrder: 0,
}

const statusStyles = {
  draft: 'bg-amber-50 text-amber-700 ring-amber-200',
  published: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  archived: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const typeIcons = {
  project_proposal: ClipboardList,
  accomplishment: FileCheck2,
  activity: CalendarCheck,
  liquidation: ReceiptText,
  resolution: FileText,
}

const inputClassName = 'admin-field mt-2 placeholder:text-slate-400'

function toDateTimeInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (number) => String(number).padStart(2, '0')
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
  ].join('')
}

function getTypeLabel(type) {
  return (
    internalAuditCategories.find((category) => category.id === type)?.label ||
    type
  )
}

function existingFile(item) {
  if (!item?.file_path) return null
  return {
    path: item.file_path,
    name: item.file_name,
    size: item.file_size,
    type: item.mime_type,
  }
}

function AdminInternalAudit() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [selectedFile, setSelectedFile] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [needsSchema, setNeedsSchema] = useState(false)

  useBodyScrollLock(isEditorOpen)

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    const { data, error: loadError } = await getAdminAuditReports()

    if (loadError) {
      setError(loadError.message)
      setNeedsSchema(isAuditReportsSchemaMissing(loadError))
    } else {
      setItems(data || [])
      setError('')
      setNeedsSchema(false)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true

    getAdminAuditReports().then(({ data, error: loadError }) => {
      if (!isMounted) return

      if (loadError) {
        setError(loadError.message)
        setNeedsSchema(isAuditReportsSchemaMissing(loadError))
      } else {
        setItems(data || [])
        setError('')
        setNeedsSchema(false)
      }

      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const counts = useMemo(
    () => ({
      all: items.length,
      published: items.filter((item) => item.status === 'published').length,
      drafts: items.filter((item) => item.status === 'draft').length,
      featured: items.filter((item) => item.is_featured).length,
    }),
    [items],
  )

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return items.filter((item) => {
      const matchesType =
        selectedType === 'all' || item.report_type === selectedType
      const matchesStatus =
        selectedStatus === 'all' || item.status === selectedStatus
      const matchesSearch =
        !normalizedSearch ||
        [
          item.title,
          item.period,
          item.summary,
          item.prepared_by,
          item.reviewed_by,
          item.resolution_number,
          getTypeLabel(item.report_type),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)

      return matchesType && matchesStatus && matchesSearch
    })
  }, [items, searchTerm, selectedStatus, selectedType])

  const openEditor = (item = null) => {
    setEditingItem(item)
    setForm(
      item
        ? {
            title: item.title,
            reportType: item.report_type,
            period: item.period,
            summary: item.summary,
            preparedBy: item.prepared_by,
            reviewedBy: item.reviewed_by,
            approvedBy: item.approved_by,
            resolutionNumber: item.resolution_number,
            fundsReceived: item.funds_received ?? '',
            totalExpenses: item.total_expenses ?? '',
            remainingBalance: item.remaining_balance ?? '',
            publishedAt: toDateTimeInput(item.published_at),
            status: item.status,
            isFeatured: item.is_featured,
            sortOrder: item.sort_order,
          }
        : emptyForm,
    )
    setSelectedFile(null)
    setError('')
    setSuccess('')
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    if (isSaving) return
    setIsEditorOpen(false)
    setEditingItem(null)
    setForm(emptyForm)
    setSelectedFile(null)
  }

  const updateField = (event) => {
    const { name, type, checked, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileError = validateAuditReportFile(file)
    if (fileError) {
      setError(fileError)
      event.target.value = ''
      return
    }

    setSelectedFile(file)
    setError('')
    event.target.value = ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (
      !form.title.trim() ||
      !form.period.trim() ||
      !form.summary.trim() ||
      !form.preparedBy.trim() ||
      !form.reviewedBy.trim()
    ) {
      setError('Title, period, summary, prepared by, and reviewed by are required.')
      return
    }

    if (form.reportType === 'resolution' && !form.resolutionNumber.trim()) {
      setError('Resolution number is required for resolution records.')
      return
    }

    const hasExistingFile = Boolean(editingItem?.file_path)
    if (form.status === 'published' && !selectedFile && !hasExistingFile) {
      setError('Upload a PDF before publishing this audit record.')
      return
    }

    setIsSaving(true)
    let file = existingFile(editingItem)
    let uploadedPath = null

    if (selectedFile) {
      const { data, error: uploadError } = await uploadAuditReport(selectedFile)
      if (uploadError) {
        setError(uploadError.message)
        setIsSaving(false)
        return
      }

      uploadedPath = data.path
      file = {
        path: data.path,
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
      }
    }

    const result = editingItem
      ? await updateAuditReport(editingItem.id, form, file, editingItem.published_at)
      : await createAuditReport(form, file)

    if (result.error) {
      if (uploadedPath) await removeAuditReportFile(uploadedPath)
      setError(result.error.message)
      setNeedsSchema(isAuditReportsSchemaMissing(result.error))
      setIsSaving(false)
      return
    }

    if (editingItem?.file_path && editingItem.file_path !== file?.path) {
      await removeAuditReportFile(editingItem.file_path)
    }

    if (
      result.data.status === 'published' &&
      editingItem?.status !== 'published'
    ) {
      signalBytePublished('audit report', result.data.title)
    }

    setSuccess(editingItem ? 'Audit report updated.' : 'Audit report created.')
    setIsSaving(false)
    closeEditor()
    await loadReports()
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Permanently delete "${item.title}"?`)) return

    const { error: deleteError } = await deleteAuditReport(item.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }

    if (item.file_path) await removeAuditReportFile(item.file_path)
    setSuccess('Audit report deleted.')
    await loadReports()
  }

  const handleOpen = async (item) => {
    const reportWindow = window.open('about:blank', '_blank')
    if (reportWindow) reportWindow.opener = null

    const { data, error: openError } = await createAuditReportDownload(item)
    if (openError) {
      reportWindow?.close()
      setError(openError.message)
      return
    }

    if (reportWindow) {
      reportWindow.location.replace(data.signedUrl)
    } else {
      window.location.assign(data.signedUrl)
    }
  }

  return (
    <div className="admin-page mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
            Transparency management
          </p>
          <h2 className="mt-2 text-3xl font-black text-navy-900">
            Internal Audit
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Upload and publish approved project proposals, activity records,
            accomplishment reports, liquidation reports, and resolutions for the
            public transparency archive.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openEditor()}
          disabled={needsSchema}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          <CirclePlus size={18} aria-hidden="true" />
          New report
        </button>
      </div>

      {needsSchema && (
        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-extrabold text-amber-900">
            One database step is still required
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Run <code className="rounded bg-white px-1.5 py-1 font-bold">
              supabase/internal-audit.sql
            </code>{' '}
            in the Supabase SQL Editor, then refresh this page.
          </p>
        </div>
      )}

      {(error || success) && !needsSchema && (
        <div
          className={`mt-7 rounded-xl border px-4 py-3 text-sm font-bold ${
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
          role="status"
        >
          {error || success}
        </div>
      )}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['All reports', counts.all, Archive],
          ['Published', counts.published, BadgeCheck],
          ['Drafts', counts.drafts, FileText],
          ['Featured', counts.featured, Star],
        ].map(([label, value, Icon]) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon size={19} aria-hidden="true" />
              </span>
              <span className="text-3xl font-black text-navy-900">{value}</span>
            </div>
            <p className="mt-4 text-xs font-extrabold tracking-wide text-slate-500 uppercase">
              {label}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <label className="relative block">
              <span className="sr-only">Search audit reports</span>
              <Search
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search reports, periods, reviewers, proposals, or resolutions"
                className="admin-search-field"
              />
            </label>
            <p className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-slate-500 shadow-sm ring-1 ring-slate-200">
              Showing {filteredItems.length} of {items.length}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              ['all', 'All types'],
              ...internalAuditCategories.map((category) => [
                category.id,
                category.label,
              ]),
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedType(value)}
                className={`filter-chip ${
                  selectedType === value ? 'filter-chip-active' : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ['all', 'All statuses'],
              ['draft', 'Drafts'],
              ['published', 'Published'],
              ['archived', 'Archived'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedStatus(value)}
                className={`filter-chip ${
                  selectedStatus === value ? 'filter-chip-active' : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <AdminListSkeleton label="Loading internal audit reports" />
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ShieldCheck size={30} className="mx-auto text-brand-600" />
            <h3 className="mt-4 text-lg font-black text-navy-900">
              No audit reports yet
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Create the first transparency record when a document is approved.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Archive size={30} className="mx-auto text-brand-600" />
            <h3 className="mt-4 text-lg font-black text-navy-900">
              No matching reports
            </h3>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredItems.map((item) => {
              const Icon = typeIcons[item.report_type] || FileText

              return (
                <article
                  key={item.id}
                  className="grid gap-4 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ring-1 ring-inset ${
                          statusStyles[item.status]
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-600">
                        <Icon size={14} aria-hidden="true" />
                        {getTypeLabel(item.report_type)}
                      </span>
                      {item.is_featured && (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-600">
                          <Star size={13} fill="currentColor" />
                          Featured
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 truncate text-lg font-black text-navy-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-600">
                      {item.summary || 'No summary supplied.'}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {item.period}
                      {item.file_name
                        ? ` - ${item.file_name}${item.file_size ? ` (${formatAuditFileSize(item.file_size)})` : ''}`
                        : ' - no PDF yet'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.file_path && (
                      <button
                        type="button"
                        onClick={() => handleOpen(item)}
                        className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-500"
                        aria-label={`Open ${item.title}`}
                      >
                        <Download size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditor(item)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-extrabold text-slate-600"
                    >
                      <Edit3 size={15} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="grid size-10 place-items-center rounded-lg border border-red-200 text-red-600"
                      aria-label={`Delete ${item.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {isEditorOpen && (
        <div
          className="admin-modal-backdrop fixed inset-0 z-[70] overflow-y-auto bg-navy-950/70 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Internal audit report editor"
        >
          <div className="mx-auto my-4 max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl sm:my-8">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                  Internal audit
                </p>
                <h3 className="mt-1 text-2xl font-black text-navy-900">
                  {editingItem ? 'Update report' : 'New report'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500"
                aria-label="Close internal audit editor"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-6 sm:px-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Report title
                  <input
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    className={inputClassName}
                    required
                  />
                </label>

                <label className="text-sm font-extrabold text-navy-900">
                  Type
                  <select
                    name="reportType"
                    value={form.reportType}
                    onChange={updateField}
                    className={inputClassName}
                  >
                    {internalAuditCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-extrabold text-navy-900">
                  Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={updateField}
                    className={inputClassName}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>

                <label className="text-sm font-extrabold text-navy-900">
                  Period / coverage
                  <input
                    name="period"
                    value={form.period}
                    onChange={updateField}
                    className={inputClassName}
                    placeholder="AY 2026-2027, 1st Semester"
                    required
                  />
                </label>

                <label className="text-sm font-extrabold text-navy-900">
                  Published date
                  <input
                    type="datetime-local"
                    name="publishedAt"
                    value={form.publishedAt}
                    onChange={updateField}
                    className={inputClassName}
                  />
                </label>

                <label className="text-sm font-extrabold text-navy-900">
                  Prepared by
                  <input
                    name="preparedBy"
                    value={form.preparedBy}
                    onChange={updateField}
                    className={inputClassName}
                    required
                  />
                </label>

                <label className="text-sm font-extrabold text-navy-900">
                  Reviewed by
                  <input
                    name="reviewedBy"
                    value={form.reviewedBy}
                    onChange={updateField}
                    className={inputClassName}
                    required
                  />
                </label>

                <label className="text-sm font-extrabold text-navy-900">
                  Approved by
                  <input
                    name="approvedBy"
                    value={form.approvedBy}
                    onChange={updateField}
                    className={inputClassName}
                  />
                </label>

                <label className="text-sm font-extrabold text-navy-900">
                  Display order
                  <input
                    type="number"
                    min="0"
                    name="sortOrder"
                    value={form.sortOrder}
                    onChange={updateField}
                    className={inputClassName}
                  />
                </label>

                {form.reportType === 'resolution' && (
                  <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                    Resolution number
                    <input
                      name="resolutionNumber"
                      value={form.resolutionNumber}
                      onChange={updateField}
                      className={inputClassName}
                      placeholder="Resolution No. 01, Series of 2026"
                      required
                    />
                  </label>
                )}

                {form.reportType === 'liquidation' && (
                  <>
                    <label className="text-sm font-extrabold text-navy-900">
                      Funds received
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="fundsReceived"
                        value={form.fundsReceived}
                        onChange={updateField}
                        className={inputClassName}
                      />
                    </label>
                    <label className="text-sm font-extrabold text-navy-900">
                      Total expenses
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="totalExpenses"
                        value={form.totalExpenses}
                        onChange={updateField}
                        className={inputClassName}
                      />
                    </label>
                    <label className="text-sm font-extrabold text-navy-900">
                      Remaining balance
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="remainingBalance"
                        value={form.remainingBalance}
                        onChange={updateField}
                        className={inputClassName}
                      />
                    </label>
                  </>
                )}

                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Summary
                  <textarea
                    name="summary"
                    value={form.summary}
                    onChange={updateField}
                    className={`${inputClassName} min-h-32 resize-y leading-7`}
                    required
                  />
                </label>
              </div>

              <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-brand-50/35 px-4 py-5 text-sm font-extrabold text-brand-600">
                <Upload size={17} />
                {selectedFile ? 'Choose another PDF' : 'Upload PDF report'}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              <p className="mt-2 text-center text-xs font-bold text-slate-500">
                {selectedFile
                  ? `${selectedFile.name} - ${formatAuditFileSize(selectedFile.size)}`
                  : editingItem?.file_name
                    ? `Current: ${editingItem.file_name}`
                    : 'PDF only. Maximum 20 MB.'}
              </p>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-blue-300 bg-brand-50/45 p-4">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={form.isFeatured}
                  onChange={updateField}
                  className="mt-0.5 size-4 accent-blue-600"
                />
                <span>
                  <span className="block text-sm font-extrabold text-navy-900">
                    Feature as latest transparency file
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">
                    Featured published reports appear first on the public
                    Internal Audit page.
                  </span>
                </span>
              </label>

              {error && (
                <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-extrabold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
                >
                  {isSaving ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}
                  {isSaving ? 'Saving...' : 'Save report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInternalAudit
