import {
  Bell,
  CheckCircle2,
  CirclePlus,
  Clock3,
  Edit3,
  ExternalLink,
  FileText,
  LoaderCircle,
  Save,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminListSkeleton from './AdminListSkeleton'
import { announcementCategories } from '../data/announcements'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import {
  createAnnouncement,
  deleteAnnouncement,
  getAdminAnnouncements,
  isAnnouncementsTableMissing,
  updateAnnouncement,
} from '../lib/announcements'
import { signalBytePublished } from '../lib/byteAssistant'

const emptyForm = {
  title: '',
  category: 'Website Update',
  summary: '',
  body: '',
  status: 'draft',
  isFeatured: false,
}

const statusStyles = {
  draft: 'bg-amber-50 text-amber-700 ring-amber-200',
  published: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  archived: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const inputClassName =
  'admin-field mt-2 placeholder:text-slate-400'

function formatAdminDate(value) {
  if (!value) return 'Not published'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function AdminAnnouncements() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [needsSchema, setNeedsSchema] = useState(false)

  useBodyScrollLock(isEditorOpen)

  const loadAnnouncements = useCallback(async () => {
    setIsLoading(true)
    const { data, error: loadError } = await getAdminAnnouncements()

    if (loadError) {
      setError(loadError.message)
      setNeedsSchema(isAnnouncementsTableMissing(loadError))
    } else {
      setItems(data)
      setError('')
      setNeedsSchema(false)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true

    getAdminAnnouncements().then(({ data, error: loadError }) => {
      if (!isMounted) return

      if (loadError) {
        setError(loadError.message)
        setNeedsSchema(isAnnouncementsTableMissing(loadError))
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
      draft: items.filter((item) => item.status === 'draft').length,
    }),
    [items],
  )

  const openCreateEditor = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setError('')
    setSuccess('')
    setIsEditorOpen(true)
  }

  const openEditEditor = (item) => {
    setEditingItem(item)
    setForm({
      title: item.title,
      category: item.category,
      summary: item.summary,
      body: item.body,
      status: item.status,
      isFeatured: item.is_featured,
    })
    setError('')
    setSuccess('')
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    if (isSaving) return
    setIsEditorOpen(false)
    setEditingItem(null)
    setForm(emptyForm)
  }

  const updateField = (event) => {
    const { name, type, checked, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (
      !form.title.trim() ||
      !form.summary.trim() ||
      !form.body.trim()
    ) {
      setError('Title, summary, and content are required.')
      return
    }

    setIsSaving(true)
    const result = editingItem
      ? await updateAnnouncement(
          editingItem.id,
          form,
          editingItem.published_at,
        )
      : await createAnnouncement(form)

    if (result.error) {
      setError(result.error.message)
      setNeedsSchema(isAnnouncementsTableMissing(result.error))
      setIsSaving(false)
      return
    }

    let successMessage =
      editingItem
        ? 'Announcement updated successfully.'
        : 'Announcement created successfully.'

    const isNewlyPublished =
      result.data.status === 'published' &&
      editingItem?.status !== 'published'

    if (isNewlyPublished) {
      signalBytePublished('announcement', result.data.title)
    }

    setSuccess(successMessage)
    setIsSaving(false)
    setIsEditorOpen(false)
    setEditingItem(null)
    setForm(emptyForm)
    await loadAnnouncements()
  }

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Permanently delete "${item.title}"? This cannot be undone.`,
    )

    if (!confirmed) return

    setError('')
    setSuccess('')
    const { error: deleteError } = await deleteAnnouncement(item.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setSuccess('Announcement deleted.')
    await loadAnnouncements()
  }

  return (
    <div className="admin-page mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
            Content management
          </p>
          <h2 className="mt-2 text-3xl font-black text-navy-900">
            Announcements
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Draft notices privately, publish them to the website, or archive
            older updates.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateEditor}
          disabled={needsSchema}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CirclePlus size={18} aria-hidden="true" />
          New announcement
        </button>
      </div>

      {needsSchema && (
        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-extrabold text-amber-900">
            One database step is still required
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Open the Supabase SQL Editor and run{' '}
            <code className="rounded bg-white px-1.5 py-1 font-bold">
              supabase/announcements.sql
            </code>
            , then refresh this page.
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

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        {[
          ['All content', counts.all, FileText],
          ['Published', counts.published, CheckCircle2],
          ['Drafts', counts.draft, Clock3],
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
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h3 className="font-black text-navy-900">All announcements</h3>
            <p className="mt-1 text-xs text-slate-500">
              Most recently updated first
            </p>
          </div>
          <Bell size={21} className="text-brand-600" aria-hidden="true" />
        </div>

        {isLoading ? (
          <AdminListSkeleton label="Loading announcements" />
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Bell size={24} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-black text-navy-900">
              No announcements yet
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Create the first notice when you are ready.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {items.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase ring-1 ring-inset ${
                        statusStyles[item.status]
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {item.category}
                    </span>
                    {item.is_featured && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-600">
                        <Star size={13} fill="currentColor" />
                        Featured
                      </span>
                    )}
                  </div>
                  <h4 className="mt-3 truncate text-lg font-black text-navy-900">
                    {item.title}
                  </h4>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                    {item.summary}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {item.status === 'published'
                      ? `Published ${formatAdminDate(item.published_at)}`
                      : `Updated ${formatAdminDate(item.updated_at)}`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.status === 'published' && (
                    <Link
                      to={`/announcements/${item.slug}`}
                      target="_blank"
                      className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-brand-500 hover:text-brand-600"
                      aria-label={`View ${item.title}`}
                    >
                      <ExternalLink size={17} />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditEditor(item)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-extrabold text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
                  >
                    <Edit3 size={15} aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="grid size-10 place-items-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isEditorOpen && (
        <div
          className="admin-modal-backdrop fixed inset-0 z-[70] overflow-y-auto bg-navy-950/70 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Announcement editor"
        >
          <div className="mx-auto my-4 max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl sm:my-8">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                  {editingItem ? 'Edit content' : 'Create content'}
                </p>
                <h3 className="mt-1 text-2xl font-black text-navy-900">
                  {editingItem ? 'Update announcement' : 'New announcement'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:text-navy-900"
                aria-label="Close announcement editor"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-6 sm:px-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Title
                  <input
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    className={inputClassName}
                    placeholder="Enter announcement title"
                    maxLength={140}
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
                    {announcementCategories
                      .filter((category) => category !== 'All')
                      .map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                  </select>
                </label>

                <label className="text-sm font-extrabold text-navy-900">
                  Publication status
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

                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Short summary
                  <textarea
                    name="summary"
                    value={form.summary}
                    onChange={updateField}
                    className={`${inputClassName} min-h-24 resize-y`}
                    placeholder="A short preview shown on announcement cards"
                    maxLength={320}
                    required
                  />
                  <span className="mt-1 block text-right text-xs font-normal text-slate-400">
                    {form.summary.length}/320
                  </span>
                </label>

                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Full content
                  <textarea
                    name="body"
                    value={form.body}
                    onChange={updateField}
                    className={`${inputClassName} min-h-56 resize-y leading-7`}
                    placeholder="Write the full announcement. Separate paragraphs with a blank line."
                    required
                  />
                </label>
              </div>

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
                    Feature this announcement
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">
                    Featured notices appear before other announcements.
                  </span>
                </span>
              </label>

              {error && (
                <p
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-extrabold text-slate-600 transition hover:border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-65"
                >
                  {isSaving ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Save size={17} aria-hidden="true" />
                  )}
                  {isSaving
                    ? 'Saving...'
                    : editingItem
                      ? 'Save changes'
                      : 'Create announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAnnouncements
