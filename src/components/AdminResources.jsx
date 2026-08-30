import {
  CirclePlus,
  Edit3,
  Eye,
  FileArchive,
  FileText,
  Link2,
  LoaderCircle,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import AdminListSkeleton from './AdminListSkeleton'
import { resourceCategories } from '../data/resources'
import { signalBytePublished } from '../lib/byteAssistant'
import {
  createResource,
  createResourceDownload,
  deleteResource,
  formatFileSize,
  getAdminResources,
  isResourcesSchemaMissing,
  removeResource,
  updateResource,
  uploadResource,
  validateResourceFile,
} from '../lib/resources'

const emptyForm = {
  title: '',
  category: 'reviewers',
  description: '',
  courseCode: '',
  academicYear: '',
  externalUrl: '',
  status: 'draft',
  sortOrder: 0,
}

const statusStyles = {
  draft: 'bg-amber-50 text-amber-700 ring-amber-200',
  published: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  archived: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const inputClassName =
  'admin-field mt-2 placeholder:text-slate-400'

function existingFile(item) {
  if (!item?.file_path) return null
  return {
    path: item.file_path,
    name: item.file_name,
    size: item.file_size,
    type: item.mime_type,
  }
}

function AdminResources() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [needsSchema, setNeedsSchema] = useState(false)

  useBodyScrollLock(isEditorOpen)

  const loadResources = useCallback(async () => {
    setIsLoading(true)
    const { data, error: loadError } = await getAdminResources()

    if (loadError) {
      setError(loadError.message)
      setNeedsSchema(isResourcesSchemaMissing(loadError))
    } else {
      setItems(data)
      setError('')
      setNeedsSchema(false)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true

    getAdminResources().then(({ data, error: loadError }) => {
      if (!isMounted) return
      if (loadError) {
        setError(loadError.message)
        setNeedsSchema(isResourcesSchemaMissing(loadError))
      } else {
        setItems(data)
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
      categories: new Set(items.map((item) => item.category)).size,
    }),
    [items],
  )

  const closeEditor = () => {
    if (isSaving) return
    setIsEditorOpen(false)
    setEditingItem(null)
    setForm(emptyForm)
    setSelectedFile(null)
  }

  const openEditor = (item = null) => {
    setEditingItem(item)
    setForm(
      item
        ? {
            title: item.title,
            category: item.category,
            description: item.description,
            courseCode: item.course_code,
            academicYear: item.academic_year,
            externalUrl: item.external_url || '',
            status: item.status,
            sortOrder: item.sort_order,
          }
        : emptyForm,
    )
    setSelectedFile(null)
    setError('')
    setSuccess('')
    setIsEditorOpen(true)
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileError = validateResourceFile(file)
    if (fileError) {
      setError(fileError)
      event.target.value = ''
      return
    }

    setSelectedFile(file)
    setForm((current) => ({ ...current, externalUrl: '' }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.title.trim()) {
      setError('Resource title is required.')
      return
    }

    const hasExistingFile = Boolean(editingItem?.file_path)
    if (!selectedFile && !form.externalUrl.trim() && !hasExistingFile) {
      setError('Upload a file or provide an external resource URL.')
      return
    }

    setIsSaving(true)
    let file = form.externalUrl.trim() ? null : existingFile(editingItem)
    let uploadedPath = null

    if (selectedFile) {
      const { data, error: uploadError } = await uploadResource(selectedFile)
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
      ? await updateResource(editingItem.id, form, file)
      : await createResource(form, file)

    if (result.error) {
      if (uploadedPath) await removeResource(uploadedPath)
      setError(result.error.message)
      setNeedsSchema(isResourcesSchemaMissing(result.error))
      setIsSaving(false)
      return
    }

    const oldPath = editingItem?.file_path
    if (oldPath && oldPath !== file?.path) await removeResource(oldPath)

    if (
      result.data.status === 'published' &&
      editingItem?.status !== 'published'
    ) {
      signalBytePublished('resource', result.data.title)
    }

    setIsSaving(false)
    closeEditor()
    setSuccess(editingItem ? 'Resource updated.' : 'Resource added.')
    await loadResources()
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Permanently delete "${item.title}"?`)) return

    const { error: deleteError } = await deleteResource(item.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    if (item.file_path) await removeResource(item.file_path)
    setSuccess('Resource deleted.')
    await loadResources()
  }

  const handleOpen = async (item) => {
    const resourceWindow = window.open('about:blank', '_blank')
    if (resourceWindow) resourceWindow.opener = null

    const { data, error: openError } = await createResourceDownload(item)
    if (openError) {
      resourceWindow?.close()
      setError(openError.message)
      return
    }
    if (resourceWindow) {
      resourceWindow.location.replace(data.signedUrl)
    } else {
      window.location.assign(data.signedUrl)
    }
  }

  return (
    <div className="admin-page mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
            Academic library
          </p>
          <h2 className="mt-2 text-3xl font-black text-navy-900">Resources</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Upload member-only learning files or link to approved external
            materials. Published resources are available to approved accounts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openEditor()}
          disabled={needsSchema}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          <CirclePlus size={18} />
          Add resource
        </button>
      </div>

      {needsSchema && (
        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
          Run <code className="font-bold">supabase/resources.sql</code> in the
          Supabase SQL Editor, then refresh this page.
        </div>
      )}

      {(error || success) && !needsSchema && !isEditorOpen && (
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

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        {[
          ['All resources', counts.all, FileText],
          ['Published', counts.published, FileArchive],
          ['Active categories', counts.categories, Link2],
        ].map(([label, value, Icon]) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon size={19} />
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
        {isLoading ? (
          <AdminListSkeleton label="Loading resources" />
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText size={30} className="mx-auto text-brand-600" />
            <h3 className="mt-4 text-lg font-black text-navy-900">
              No resources yet
            </h3>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {items.map((item) => {
              const category = resourceCategories.find(
                (entry) => entry.id === item.category,
              )

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
                      <span className="text-xs font-bold text-slate-500">
                        {category?.title || item.category}
                      </span>
                      {item.course_code && (
                        <span className="text-xs font-extrabold text-brand-600">
                          {item.course_code}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 truncate text-lg font-black text-navy-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-600">
                      {item.description || 'No description supplied.'}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {item.external_url
                        ? 'External link'
                        : `${item.file_name}${item.file_size ? ` · ${formatFileSize(item.file_size)}` : ''}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpen(item)}
                      className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-500"
                      aria-label={`Open ${item.title}`}
                    >
                      <Eye size={16} />
                    </button>
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
          aria-label="Resource editor"
        >
          <div className="mx-auto my-4 max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl sm:my-8">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                  Student library
                </p>
                <h3 className="mt-1 text-2xl font-black text-navy-900">
                  {editingItem ? 'Update resource' : 'Add resource'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500"
                aria-label="Close resource editor"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-6 sm:px-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Resource title
                  <input
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    className={inputClassName}
                    required
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900">
                  Category
                  <select
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    className={inputClassName}
                  >
                    {resourceCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.title}
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
                  Course code
                  <input
                    name="courseCode"
                    value={form.courseCode}
                    onChange={updateField}
                    className={inputClassName}
                    placeholder="CpE 123"
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900">
                  Academic year
                  <input
                    name="academicYear"
                    value={form.academicYear}
                    onChange={updateField}
                    className={inputClassName}
                    placeholder="2026-2027"
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Description
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    className={`${inputClassName} min-h-28 resize-y`}
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
                <label className="text-sm font-extrabold text-navy-900">
                  External URL
                  <input
                    type="url"
                    name="externalUrl"
                    value={form.externalUrl}
                    onChange={(event) => {
                      updateField(event)
                      if (event.target.value) setSelectedFile(null)
                    }}
                    className={inputClassName}
                    placeholder="https://..."
                  />
                </label>
              </div>

              <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-brand-50/35 p-5">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-brand-600 ring-1 ring-blue-100">
                  <Upload size={17} />
                  {selectedFile ? 'Choose another file' : 'Upload resource file'}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
                <p className="mt-3 text-center text-xs text-slate-500">
                  {selectedFile
                    ? `${selectedFile.name} · ${formatFileSize(selectedFile.size)}`
                    : editingItem?.file_name
                      ? `Current: ${editingItem.file_name}`
                      : 'PDF, Office, ZIP, or text file. Maximum 20 MB.'}
                </p>
              </div>

              {error && (
                <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-6">
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
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
                >
                  {isSaving ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}
                  {isSaving ? 'Saving...' : 'Save resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminResources
