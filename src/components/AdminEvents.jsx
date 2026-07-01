import {
  CalendarCheck2,
  CalendarDays,
  CalendarOff,
  CirclePlus,
  Clock3,
  Edit3,
  ExternalLink,
  Filter,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  Save,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import AdminListSkeleton from './AdminListSkeleton'
import { signalBytePublished } from '../lib/byteAssistant'
import {
  createEvent,
  deleteEvent,
  eventCategories,
  getAdminEvents,
  getEventTiming,
  isEventsTableMissing,
  updateEvent,
} from '../lib/events'
import {
  mediaBucket,
  removeMedia,
  uploadMedia,
  validateMediaFile,
} from '../lib/media'
import { supabase } from '../lib/supabase'

const emptyForm = {
  title: '',
  category: 'General Assembly',
  summary: '',
  description: '',
  venue: '',
  startsAt: '',
  endsAt: '',
  registrationUrl: '',
  imageAlt: '',
  showInGallery: true,
  status: 'draft',
  isFeatured: false,
}

const statusStyles = {
  draft: 'bg-amber-50 text-amber-700 ring-amber-200',
  published: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
  archived: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const timingStyles = {
  upcoming: 'bg-blue-50 text-blue-700 ring-blue-200',
  completed: 'bg-slate-100 text-slate-600 ring-slate-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

const statusFilters = [
  ['all', 'All statuses'],
  ['draft', 'Drafts'],
  ['published', 'Published'],
  ['cancelled', 'Cancelled'],
  ['archived', 'Archived'],
]

const timingFilters = [
  ['all', 'All timing'],
  ['upcoming', 'Upcoming'],
  ['completed', 'Completed'],
  ['featured', 'Featured'],
]

const inputClassName =
  'admin-field mt-2 placeholder:text-slate-400'

function toDateTimeInput(value) {
  if (!value) return ''

  const date = new Date(value)
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

function formatAdminDate(value) {
  if (!value) return 'No date'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function getImageUrl(path) {
  if (!path) return ''
  return supabase.storage.from(mediaBucket).getPublicUrl(path).data.publicUrl
}

function revokePreviewUrl(url) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}

function getTimingLabel(item) {
  const timing = getEventTiming(item)

  if (timing === 'completed') return 'Completed'
  if (timing === 'cancelled') return 'Changed'
  return 'Upcoming'
}

function AdminEvents() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedTiming, setSelectedTiming] = useState('all')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [needsSchema, setNeedsSchema] = useState(false)

  useBodyScrollLock(isEditorOpen)

  const loadEvents = useCallback(async () => {
    setIsLoading(true)
    const { data, error: loadError } = await getAdminEvents()

    if (loadError) {
      setError(loadError.message)
      setNeedsSchema(isEventsTableMissing(loadError))
    } else {
      setItems(data)
      setError('')
      setNeedsSchema(false)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true

    getAdminEvents().then(({ data, error: loadError }) => {
      if (!isMounted) return

      if (loadError) {
        setError(loadError.message)
        setNeedsSchema(isEventsTableMissing(loadError))
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

  useEffect(
    () => () => {
      revokePreviewUrl(previewUrl)
    },
    [previewUrl],
  )

  const counts = useMemo(
    () => ({
      all: items.length,
      upcoming: items.filter(
        (item) =>
          item.status === 'published' &&
          getEventTiming(item) === 'upcoming',
      ).length,
      published: items.filter((item) => item.status === 'published').length,
      drafts: items.filter((item) => item.status === 'draft').length,
      featured: items.filter((item) => item.is_featured).length,
    }),
    [items],
  )

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return items.filter((item) => {
      const timing = getEventTiming(item)
      const matchesStatus =
        selectedStatus === 'all' || item.status === selectedStatus
      const matchesTiming =
        selectedTiming === 'all' ||
        (selectedTiming === 'featured'
          ? item.is_featured
          : timing === selectedTiming)
      const matchesSearch =
        !normalizedSearch ||
        [
          item.title,
          item.summary,
          item.description,
          item.venue,
          item.category,
          item.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)

      return matchesStatus && matchesTiming && matchesSearch
    })
  }, [items, searchTerm, selectedStatus, selectedTiming])

  const openCreateEditor = () => {
    revokePreviewUrl(previewUrl)
    setEditingItem(null)
    setForm(emptyForm)
    setSelectedFile(null)
    setPreviewUrl('')
    setError('')
    setSuccess('')
    setIsEditorOpen(true)
  }

  const openEditEditor = (item) => {
    revokePreviewUrl(previewUrl)
    setEditingItem(item)
    setForm({
      title: item.title,
      category: item.category,
      summary: item.summary,
      description: item.description,
      venue: item.venue,
      startsAt: toDateTimeInput(item.starts_at),
      endsAt: toDateTimeInput(item.ends_at),
      registrationUrl: item.registration_url || '',
      imageAlt: item.image_alt || '',
      showInGallery: item.show_in_gallery ?? true,
      status: item.status,
      isFeatured: item.is_featured,
    })
    setSelectedFile(null)
    setPreviewUrl(getImageUrl(item.image_path))
    setError('')
    setSuccess('')
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    if (isSaving) return
    revokePreviewUrl(previewUrl)
    setIsEditorOpen(false)
    setEditingItem(null)
    setForm(emptyForm)
    setSelectedFile(null)
    setPreviewUrl('')
  }

  const updateField = (event) => {
    const { name, type, checked, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null
    const fileError = validateMediaFile(file)

    if (fileError) {
      setError(fileError)
      event.target.value = ''
      return
    }

    revokePreviewUrl(previewUrl)
    setSelectedFile(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : '')
    setForm((current) => ({
      ...current,
      showInGallery: file ? current.showInGallery : false,
    }))
    setError('')
    event.target.value = ''
  }

  const clearEventImage = () => {
    revokePreviewUrl(previewUrl)
    setSelectedFile(null)
    setPreviewUrl('')
    setForm((current) => ({
      ...current,
      imageAlt: '',
      showInGallery: false,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (
      !form.title.trim() ||
      !form.summary.trim() ||
      !form.description.trim() ||
      !form.venue.trim() ||
      !form.startsAt
    ) {
      setError(
        'Title, summary, description, venue, and start date are required.',
      )
      return
    }

    if (form.endsAt && new Date(form.endsAt) < new Date(form.startsAt)) {
      setError('The event end date cannot be before the start date.')
      return
    }

    if ((selectedFile || previewUrl) && !form.imageAlt.trim()) {
      setError('Add a short image description before saving this event photo.')
      return
    }

    setIsSaving(true)
    let uploadedPath = null

    if (selectedFile) {
      const uploadResult = await uploadMedia(selectedFile, 'events')
      if (uploadResult.error) {
        setError(uploadResult.error.message)
        setIsSaving(false)
        return
      }

      uploadedPath = uploadResult.data.path
    }

    const imagePath =
      uploadedPath || (previewUrl ? editingItem?.image_path : null)
    const result = editingItem
      ? await updateEvent(
          editingItem.id,
          form,
          imagePath,
          editingItem.published_at,
        )
      : await createEvent(form, imagePath)

    if (result.error) {
      if (uploadedPath) await removeMedia(uploadedPath)
      setError(result.error.message)
      setNeedsSchema(isEventsTableMissing(result.error))
      setIsSaving(false)
      return
    }

    if (editingItem?.image_path && editingItem.image_path !== imagePath) {
      await removeMedia(editingItem.image_path)
    }

    if (
      result.data.status === 'published' &&
      editingItem?.status !== 'published'
    ) {
      signalBytePublished('event', result.data.title)
    }

    setSuccess(
      editingItem
        ? 'Event updated successfully.'
        : 'Event created successfully.',
    )
    setIsSaving(false)
    revokePreviewUrl(previewUrl)
    setIsEditorOpen(false)
    setEditingItem(null)
    setForm(emptyForm)
    setSelectedFile(null)
    setPreviewUrl('')
    await loadEvents()
  }

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Permanently delete "${item.title}"? This cannot be undone.`,
    )

    if (!confirmed) return

    setError('')
    setSuccess('')
    const { error: deleteError } = await deleteEvent(item.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    if (item.image_path) await removeMedia(item.image_path)

    setSuccess('Event deleted.')
    await loadEvents()
  }

  return (
    <div className="admin-page mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
            Calendar management
          </p>
          <h2 className="mt-2 text-3xl font-black text-navy-900">Events</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Schedule activities, publish registration information, and keep
            cancelled or completed event records accurate.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateEditor}
          disabled={needsSchema}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CirclePlus size={18} aria-hidden="true" />
          New event
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
              supabase/events.sql
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

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['All events', counts.all, FileText],
          ['Upcoming', counts.upcoming, CalendarCheck2],
          ['Published', counts.published, CalendarDays],
          ['Drafts', counts.drafts, Clock3],
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
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h3 className="font-black text-navy-900">Event schedule</h3>
            <p className="mt-1 text-xs text-slate-500">
              Ordered by event date. Use filters to review what needs action.
            </p>
          </div>
          <CalendarDays
            size={21}
            className="text-brand-600"
            aria-hidden="true"
          />
        </div>

        {!isLoading && items.length > 0 && (
          <div className="border-b border-slate-300 bg-slate-50/70 px-5 py-5 sm:px-6">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <label className="relative block">
                <span className="sr-only">Search events</span>
                <Search
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search title, venue, category, status, or description"
                  className="admin-search-field"
                />
              </label>
              <p className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-slate-500 shadow-sm ring-1 ring-slate-200">
                Showing {filteredItems.length} of {items.length}
              </p>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto]">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                  <Filter size={14} aria-hidden="true" />
                  Status
                </div>
                <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                  {statusFilters.map(([value, label]) => {
                    const isActive = selectedStatus === value

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedStatus(value)}
                        aria-pressed={isActive}
                        className={`filter-chip ${
                          isActive ? 'filter-chip-active' : ''
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 text-[10px] font-extrabold tracking-[0.16em] text-slate-500 uppercase xl:text-right">
                  Timing
                </div>
                <div className="flex flex-wrap justify-center gap-2 sm:justify-start xl:justify-end">
                  {timingFilters.map(([value, label]) => {
                    const isActive = selectedTiming === value

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedTiming(value)}
                        aria-pressed={isActive}
                        className={`filter-chip ${
                          isActive ? 'filter-chip-active' : ''
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <AdminListSkeleton label="Loading events" />
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <CalendarDays size={24} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-black text-navy-900">
              No events yet
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Create an event when the next activity is confirmed.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <CalendarOff size={24} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-black text-navy-900">
              No matching events
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Try another search term, status, or timing filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredItems.map((item) => {
              const timing = getEventTiming(item)

              return (
                <article
                  key={item.id}
                  className="grid gap-4 px-5 py-5 transition hover:bg-slate-50/70 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center"
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
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase ring-1 ring-inset ${
                          timingStyles[timing]
                        }`}
                      >
                        {getTimingLabel(item)}
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
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-brand-600" />
                        {formatAdminDate(item.starts_at)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={14} className="text-brand-600" />
                        {item.venue}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['published', 'cancelled'].includes(item.status) && (
                      <Link
                        to="/events"
                        target="_blank"
                        className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-brand-500 hover:text-brand-600"
                        aria-label={`View ${item.title} on the events page`}
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
          aria-label="Event editor"
        >
          <div className="mx-auto my-4 max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl sm:my-8">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                  {editingItem ? 'Edit schedule' : 'Create schedule'}
                </p>
                <h3 className="mt-1 text-2xl font-black text-navy-900">
                  {editingItem ? 'Update event' : 'New event'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:text-navy-900"
                aria-label="Close event editor"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-6 sm:px-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Event title
                  <input
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    className={inputClassName}
                    placeholder="Enter the event title"
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
                    {eventCategories.map((category) => (
                      <option key={category}>{category}</option>
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
                    <option value="cancelled">Cancelled</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>

                <label className="text-sm font-extrabold text-navy-900">
                  Start date and time
                  <input
                    type="datetime-local"
                    name="startsAt"
                    value={form.startsAt}
                    onChange={updateField}
                    className={inputClassName}
                    required
                  />
                </label>

                <label className="text-sm font-extrabold text-navy-900">
                  End date and time
                  <input
                    type="datetime-local"
                    name="endsAt"
                    value={form.endsAt}
                    min={form.startsAt || undefined}
                    onChange={updateField}
                    className={inputClassName}
                  />
                </label>

                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Venue
                  <input
                    name="venue"
                    value={form.venue}
                    onChange={updateField}
                    className={inputClassName}
                    placeholder="Building, room, or online platform"
                    maxLength={180}
                    required
                  />
                </label>

                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Short summary
                  <textarea
                    name="summary"
                    value={form.summary}
                    onChange={updateField}
                    className={`${inputClassName} min-h-24 resize-y`}
                    placeholder="A concise preview for event cards"
                    maxLength={320}
                    required
                  />
                  <span className="mt-1 block text-right text-xs font-normal text-slate-400">
                    {form.summary.length}/320
                  </span>
                </label>

                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Full description
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    className={`${inputClassName} min-h-40 resize-y leading-7`}
                    placeholder="Include the purpose, audience, requirements, and other important details."
                    required
                  />
                </label>

                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Registration link
                  <input
                    type="url"
                    name="registrationUrl"
                    value={form.registrationUrl}
                    onChange={updateField}
                    className={inputClassName}
                    placeholder="https://forms.example.com/event-registration"
                  />
                </label>

                <div className="rounded-2xl border border-dashed border-blue-200 bg-brand-50/35 p-5 sm:col-span-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-extrabold text-navy-900">
                        Event photo
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Upload one approved image. It can also appear in the
                        public gallery archive.
                      </p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-brand-600 ring-1 ring-blue-100">
                      <Upload size={17} aria-hidden="true" />
                      {previewUrl ? 'Change image' : 'Upload image'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  {previewUrl ? (
                    <div className="mt-4 grid gap-4 rounded-2xl border border-blue-100 bg-white p-4 sm:grid-cols-[180px_1fr]">
                      <img
                        src={previewUrl}
                        alt=""
                        className="aspect-[4/3] w-full rounded-xl bg-slate-100 object-cover"
                      />
                      <div className="grid gap-4">
                        <label className="text-sm font-extrabold text-navy-900">
                          Image description
                          <input
                            name="imageAlt"
                            value={form.imageAlt}
                            onChange={updateField}
                            className={inputClassName}
                            placeholder="Describe who or what is shown"
                            required
                          />
                        </label>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-blue-300 bg-brand-50/45 p-4">
                          <input
                            type="checkbox"
                            name="showInGallery"
                            checked={form.showInGallery}
                            onChange={updateField}
                            className="mt-0.5 size-4 accent-blue-600"
                          />
                          <span>
                            <span className="block text-sm font-extrabold text-navy-900">
                              Show this photo in Gallery archive
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-slate-600">
                              Published events marked here will appear in News
                              & Gallery automatically.
                            </span>
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={clearEventImage}
                          className="justify-self-start rounded-xl border border-red-200 px-4 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-50"
                        >
                          Remove image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-blue-200 bg-white/70 p-6 text-center text-sm font-bold text-slate-500">
                      <ImageIcon
                        size={24}
                        className="mx-auto mb-2 text-brand-600"
                        aria-hidden="true"
                      />
                      No event photo yet. The event can still be saved without
                      an image.
                    </div>
                  )}
                </div>
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
                    Feature this event
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">
                    Featured upcoming events appear first on the homepage.
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
                      : 'Create event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminEvents
