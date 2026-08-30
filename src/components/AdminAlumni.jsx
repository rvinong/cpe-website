import {
  Award,
  BriefcaseBusiness,
  ChevronDown,
  CirclePlus,
  Edit3,
  GraduationCap,
  ImageUp,
  LoaderCircle,
  Save,
  Search,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { officerPositionOptions } from '../data/organizationPositions'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import AdminListSkeleton from './AdminListSkeleton'
import { signalBytePublished } from '../lib/byteAssistant'
import PublishedPhotoPreview from './PublishedPhotoPreview'
import {
  createAlumniProfile,
  deleteAlumniProfile,
  getAdminAlumni,
  isAlumniSchemaMissing,
  removeAlumniPhoto,
  updateAlumniProfile,
  uploadAlumniPhoto,
  validateAlumniPhoto,
  getAdminAlumniLeadership,
  replaceAlumniLeadership,
} from '../lib/alumni'

const emptyForm = {
  name: '',
  batch: '',
  role: '',
  organization: '',
  history: '',
  highlight: '',
  status: 'draft',
  isFeatured: false,
  consentConfirmed: false,
  leadership: [],
}

const leadershipCategories = [
  'Department',
  'College Organization',
  'Student Organization',
  'Class Organization',
  'Other',
]

const leadershipPositionOptions = [
  ...officerPositionOptions,
  'Department Representative',
  'College Representative',
  'Class Representative',
  'Committee Chairperson',
  'Committee Member',
  'Project Lead',
  'Faculty Representative',
  'Other',
]

const leadershipOrganizationSuggestions = [
  'Computer Engineering Department',
  'College of Engineering',
  'ICpEP.se NWSSU Chapter',
  'College Student Council',
  'Institutional Supreme Student Council',
  'Class Organization',
]

const statusStyles = {
  draft: 'bg-amber-50 text-amber-700 ring-amber-200',
  published: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  archived: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const inputClassName =
  'admin-field mt-2 placeholder:text-slate-400'

function AdminAlumni() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [leadershipByProfile, setLeadershipByProfile] = useState({})
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [nameSearchTerm, setNameSearchTerm] = useState('')
  const [expandedBatches, setExpandedBatches] = useState({})
  const [needsSchema, setNeedsSchema] = useState(false)
  const [needsLeadershipSchema, setNeedsLeadershipSchema] = useState(false)

  useBodyScrollLock(isEditorOpen)

  const loadAlumni = useCallback(async (isActive = () => true) => {
    setIsLoading(true)
    try {
      const { data, error: loadError } = await getAdminAlumni()

      if (!isActive()) return

      if (loadError) {
        setError(loadError.message)
        setNeedsSchema(isAlumniSchemaMissing(loadError))
        return
      }

      const {
        data: leadershipData,
        error: leadershipError,
      } = await getAdminAlumniLeadership()

      if (!isActive()) return

      if (leadershipError) {
        const schemaMissing = isAlumniSchemaMissing(leadershipError)
        setLeadershipByProfile({})
        setNeedsLeadershipSchema(schemaMissing)
        setError(schemaMissing ? '' : leadershipError.message)
      } else {
        setLeadershipByProfile(
          leadershipData.reduce((groups, entry) => {
            if (!groups[entry.alumni_profile_id]) {
              groups[entry.alumni_profile_id] = []
            }
            groups[entry.alumni_profile_id].push(entry)
            return groups
          }, {}),
        )
        setNeedsLeadershipSchema(false)
        setError('')
      }

      setItems(data)
      setNeedsSchema(false)
    } catch (loadError) {
      if (isActive()) {
        setError(loadError.message || 'Unable to load alumni profiles.')
      }
    } finally {
      if (isActive()) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const loadTimer = window.setTimeout(() => {
      loadAlumni(() => isMounted)
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(loadTimer)
    }
  }, [loadAlumni])

  useEffect(
    () => () => {
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    },
    [previewUrl],
  )

  const counts = useMemo(
    () => ({
      all: items.length,
      published: items.filter((item) => item.status === 'published').length,
      featured: items.filter((item) => item.is_featured).length,
    }),
    [items],
  )

  const batchGroups = useMemo(() => {
    const grouped = new Map()

    items.forEach((item) => {
      const batch = String(item.batch || '').trim() || 'Not specified'
      const currentItems = grouped.get(batch) || []
      grouped.set(batch, [...currentItems, item])
    })

    return Array.from(grouped, ([batch, batchItems]) => ({
      batch,
      items: batchItems.sort((first, second) =>
        String(first.name || '').localeCompare(String(second.name || '')),
      ),
    })).sort((first, second) => {
      const firstYear = Number(first.batch.match(/\d{4}/)?.[0] || 0)
      const secondYear = Number(second.batch.match(/\d{4}/)?.[0] || 0)

      if (firstYear !== secondYear) return secondYear - firstYear
      return first.batch.localeCompare(second.batch, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    })
  }, [items])

  const filteredBatchGroups = useMemo(() => {
    const normalizedSearch = nameSearchTerm.trim().toLowerCase()
    if (!normalizedSearch) return batchGroups

    return batchGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          String(item.name || '').toLowerCase().includes(normalizedSearch),
        ),
      }))
      .filter((group) => group.items.length > 0)
  }, [batchGroups, nameSearchTerm])

  const filteredProfileCount = filteredBatchGroups.reduce(
    (total, group) => total + group.items.length,
    0,
  )

  const toggleBatch = (batch) => {
    setExpandedBatches((current) => ({
      ...current,
      [batch]: !(current[batch] ?? true),
    }))
  }

  const resetEditor = () => {
    if (isSaving) return
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setIsEditorOpen(false)
    setEditingItem(null)
    setForm({ ...emptyForm, leadership: [] })
    setSelectedFile(null)
    setPreviewUrl('')
  }

  const openEditor = (item = null) => {
    setEditingItem(item)
    setForm(
      item
        ? {
            name: item.name,
            batch: item.batch,
            role: item.professional_role,
            organization: item.organization,
            history: item.organization_history,
            highlight: item.highlight,
            status: item.status,
            isFeatured: item.is_featured,
            consentConfirmed: item.consent_confirmed,
            leadership: (
              leadershipByProfile[item.id] || item.leadership || []
            ).map((entry) => ({ ...entry })),
          }
        : { ...emptyForm, leadership: [] },
    )
    setSelectedFile(null)
    setPreviewUrl(
      item?.photo_path
        ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/organization-media/${item.photo_path}`
        : '',
    )
    setError('')
    setSuccess('')
    setIsEditorOpen(true)
  }

  const addLeadershipEntry = () => {
    setForm((current) => ({
      ...current,
      leadership: [
        ...current.leadership,
        {
          id: crypto.randomUUID(),
          organization: '',
          position: '',
          category: 'Student Organization',
          term: '',
          description: '',
        },
      ],
    }))
  }

  const updateLeadershipEntry = (index, field, value) => {
    setForm((current) => ({
      ...current,
      leadership: current.leadership.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }))
  }

  const removeLeadershipEntry = (index) => {
    setForm((current) => ({
      ...current,
      leadership: current.leadership.filter(
        (_, entryIndex) => entryIndex !== index,
      ),
    }))
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

    const fileError = validateAlumniPhoto(file)
    if (fileError) {
      setError(fileError)
      event.target.value = ''
      return
    }

    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.name.trim() || !form.batch.trim()) {
      setError('Graduate name and batch are required.')
      return
    }

    const leadershipEntries = form.leadership.filter((entry) =>
      [
        entry.organization,
        entry.position,
        entry.term,
        entry.description,
      ].some((value) => value?.trim()),
    )
    const hasIncompleteLeadership = leadershipEntries.some(
      (entry) => !entry.organization.trim() || !entry.position.trim(),
    )

    if (hasIncompleteLeadership) {
      setError('Each leadership role needs an organization and position.')
      return
    }
    if (needsLeadershipSchema && leadershipEntries.length > 0) {
      setError(
        'Run the updated supabase/alumni.sql file before saving leadership roles.',
      )
      return
    }

    if (form.status === 'published' && !form.consentConfirmed) {
      setError('Confirm publication consent before publishing this profile.')
      return
    }
    if (
      form.status === 'published' &&
      !selectedFile &&
      !editingItem?.photo_path
    ) {
      setError('Add a profile photo before publishing this alumni profile.')
      return
    }

    setIsSaving(true)
    let photoPath = editingItem?.photo_path || null
    let uploadedPath = null

    if (selectedFile) {
      const { data, error: uploadError } = await uploadAlumniPhoto(selectedFile)
      if (uploadError) {
        setError(uploadError.message)
        setIsSaving(false)
        return
      }
      uploadedPath = data.path
      photoPath = data.path
    }

    const result = editingItem
      ? await updateAlumniProfile(
          editingItem.id,
          form,
          photoPath,
          editingItem.published_at,
        )
      : await createAlumniProfile(form, photoPath)

    if (result.error) {
      if (uploadedPath) await removeAlumniPhoto(uploadedPath)
      setError(result.error.message)
      setNeedsSchema(isAlumniSchemaMissing(result.error))
      setIsSaving(false)
      return
    }

    if (
      uploadedPath &&
      editingItem?.photo_path &&
      editingItem.photo_path !== uploadedPath
    ) {
      await removeAlumniPhoto(editingItem.photo_path)
    }

    if (!needsLeadershipSchema) {
      const leadershipResult = await replaceAlumniLeadership(
        result.data.id,
        form.leadership,
      )

      if (leadershipResult.error) {
        setError(leadershipResult.error.message)
        setNeedsLeadershipSchema(isAlumniSchemaMissing(leadershipResult.error))
        setIsSaving(false)
        return
      }
    }

    if (
      result.data.status === 'published' &&
      editingItem?.status !== 'published'
    ) {
      signalBytePublished('alumni', result.data.name)
    }

    setIsSaving(false)
    resetEditor()
    setSuccess(editingItem ? 'Alumni profile updated.' : 'Alumni profile added.')
    await loadAlumni()
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Permanently delete ${item.name}'s alumni profile?`)) {
      return
    }

    const { error: deleteError } = await deleteAlumniProfile(item.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    if (item.photo_path) await removeAlumniPhoto(item.photo_path)
    setSuccess('Alumni profile deleted.')
    await loadAlumni()
  }

  return (
    <div className="admin-page mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
            Graduate archive
          </p>
          <h2 className="mt-2 text-3xl font-black text-navy-900">Alumni</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Maintain verified yearbook profiles and spotlight selected
            graduates after publication consent is confirmed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openEditor()}
          disabled={needsSchema}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          <CirclePlus size={18} />
          Add graduate
        </button>
      </div>

      {needsSchema && (
        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
          Run <code className="font-bold">supabase/alumni.sql</code> in the
          Supabase SQL Editor, then refresh this page.
        </div>
      )}

      {needsLeadershipSchema && !needsSchema && (
        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
          Run the updated <code className="font-bold">supabase/alumni.sql</code>{' '}
          file to enable leadership background records.
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
          ['Profiles', counts.all, UsersRound],
          ['Published', counts.published, GraduationCap],
          ['Spotlights', counts.featured, Award],
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
          <AdminListSkeleton withMedia label="Loading alumni" />
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <GraduationCap
              size={30}
              className="mx-auto text-brand-600"
              aria-hidden="true"
            />
            <h3 className="mt-4 text-lg font-black text-navy-900">
              No alumni profiles yet
            </h3>
          </div>
        ) : (
          <>
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <label className="relative block lg:max-w-xl lg:flex-1">
                  <span className="sr-only">Search alumni by name</span>
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={nameSearchTerm}
                    onChange={(event) => setNameSearchTerm(event.target.value)}
                    placeholder="Search alumni by name"
                    className="admin-search-field pl-11"
                  />
                </label>
                <p className="text-xs font-extrabold text-slate-500">
                  Showing {filteredProfileCount} of {items.length} profiles
                </p>
              </div>
            </div>

            {filteredBatchGroups.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Search
                  size={30}
                  className="mx-auto text-brand-600"
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-lg font-black text-navy-900">
                  No alumni found
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  No profile names match &ldquo;{nameSearchTerm}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => setNameSearchTerm('')}
                  className="mt-5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-extrabold text-white"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredBatchGroups.map((group, index) => {
                  const isExpanded =
                    nameSearchTerm.trim().length > 0 ||
                    (expandedBatches[group.batch] ?? index === 0)
                  const batchContentId = `alumni-batch-${index}`

                  return (
                    <div key={group.batch}>
                      <button
                        type="button"
                        onClick={() => toggleBatch(group.batch)}
                        aria-expanded={isExpanded}
                        aria-controls={batchContentId}
                        className="flex w-full items-center justify-between gap-4 bg-slate-50/70 px-5 py-4 text-left transition hover:bg-brand-50/50 sm:px-6"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-xs font-black text-brand-600 ring-1 ring-blue-100">
                            {group.batch.match(/\d{4}/)?.[0] || '?'}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black text-navy-900">
                              Batch {group.batch}
                            </span>
                            <span className="mt-0.5 block text-xs font-bold text-slate-500">
                              {group.items.length}{' '}
                              {group.items.length === 1 ? 'profile' : 'profiles'}
                            </span>
                          </span>
                        </span>
                        <ChevronDown
                          size={19}
                          className={`shrink-0 text-slate-500 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      {isExpanded && (
                        <div
                          id={batchContentId}
                          className="divide-y divide-slate-200 border-t border-slate-200"
                        >
                          {group.items.map((item) => (
                            <article
                              key={item.id}
                              className="grid gap-4 px-5 py-5 sm:grid-cols-[64px_1fr_auto] sm:items-center sm:px-6"
                            >
                              {item.photo_path ? (
                                <img
                                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/organization-media/${item.photo_path}`}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  className="size-16 rounded-2xl object-cover"
                                />
                              ) : (
                                <span className="grid size-16 place-items-center rounded-2xl bg-brand-50 font-black text-brand-600">
                                  {item.name
                                    .split(/\s+/)
                                    .slice(0, 2)
                                    .map((part) => part[0])
                                    .join('')}
                                </span>
                              )}
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ring-1 ring-inset ${
                                      statusStyles[item.status]
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                  {item.is_featured && (
                                    <span className="text-xs font-extrabold text-amber-600">
                                      Spotlight
                                    </span>
                                  )}
                                  {(leadershipByProfile[item.id] || []).length >
                                    0 && (
                                    <span className="text-xs font-extrabold text-violet-600">
                                      {(leadershipByProfile[item.id] || []).length}{' '}
                                      leadership role
                                      {(leadershipByProfile[item.id] || [])
                                        .length === 1
                                        ? ''
                                        : 's'}
                                    </span>
                                  )}
                                </div>
                                <h3 className="mt-2 truncate text-lg font-black text-navy-900">
                                  {item.name}
                                </h3>
                                <p className="mt-1 truncate text-sm text-slate-600">
                                  {[item.professional_role, item.organization]
                                    .filter(Boolean)
                                    .join(' at ') ||
                                    'Career details not supplied'}
                                </p>
                              </div>
                              <div className="flex gap-2">
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
                                  aria-label={`Delete ${item.name}`}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </section>

      {isEditorOpen && (
        <div
          className="admin-modal-backdrop fixed inset-0 z-[70] overflow-y-auto bg-navy-950/70 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Alumni profile editor"
        >
          <div className="mx-auto my-4 max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl sm:my-8">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                  Yearbook profile
                </p>
                <h3 className="mt-1 text-2xl font-black text-navy-900">
                  {editingItem ? 'Update graduate' : 'Add graduate'}
                </h3>
              </div>
              <button
                type="button"
                onClick={resetEditor}
                className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500"
                aria-label="Close alumni editor"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-6 sm:px-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-extrabold text-navy-900">
                  Graduate name
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    className={inputClassName}
                    required
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900">
                  Graduation batch
                  <input
                    name="batch"
                    value={form.batch}
                    onChange={updateField}
                    className={inputClassName}
                    placeholder="2026"
                    required
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900">
                  Current role or field
                  <input
                    name="role"
                    value={form.role}
                    onChange={updateField}
                    className={inputClassName}
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900">
                  Company or organization
                  <input
                    name="organization"
                    value={form.organization}
                    onChange={updateField}
                    className={inputClassName}
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Organization history
                  <input
                    name="history"
                    value={form.history}
                    onChange={updateField}
                    className={inputClassName}
                    placeholder="Former officer position or involvement"
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Achievements
                  <textarea
                    name="highlight"
                    value={form.highlight}
                    onChange={updateField}
                    className={`${inputClassName} min-h-28 resize-y`}
                  />
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
              </div>

              <section className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/45 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-violet-600 shadow-sm ring-1 ring-violet-200">
                      <BriefcaseBusiness size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-navy-900">
                        Leadership background
                      </h4>
                      <p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">
                        Add department, college, class, or student organization
                        roles held by this graduate.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addLeadershipEntry}
                    disabled={needsLeadershipSchema}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-extrabold text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CirclePlus size={15} aria-hidden="true" />
                    Add role
                  </button>
                </div>

                {form.leadership.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-dashed border-violet-200 bg-white/70 px-4 py-3 text-xs font-bold text-slate-500">
                    No leadership roles added yet.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {form.leadership.map((entry, index) => (
                      <fieldset
                        key={entry.id || `leadership-${index}`}
                        className="rounded-xl border border-violet-200 bg-white p-4"
                      >
                        <legend className="sr-only">
                          Leadership role {index + 1}
                        </legend>
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs font-extrabold tracking-[0.14em] text-violet-600 uppercase">
                            Role {index + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeLeadershipEntry(index)}
                            className="grid size-8 place-items-center rounded-lg text-red-600 transition hover:bg-red-50"
                            aria-label={`Remove leadership role ${index + 1}`}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <label className="text-xs font-extrabold text-navy-900">
                            Organization or unit
                            <input
                              value={entry.organization}
                              onChange={(event) =>
                                updateLeadershipEntry(
                                  index,
                                  'organization',
                                  event.target.value,
                                )
                              }
                              className={inputClassName}
                              placeholder="Computer Engineering Department"
                              list="alumni-leadership-organizations"
                            />
                          </label>
                          <label className="text-xs font-extrabold text-navy-900">
                            Position
                            <select
                              value={entry.position}
                              onChange={(event) =>
                                updateLeadershipEntry(
                                  index,
                                  'position',
                                  event.target.value,
                                )
                              }
                              className={inputClassName}
                            >
                              <option value="">Select a position</option>
                              {entry.position &&
                                !leadershipPositionOptions.includes(
                                  entry.position,
                                ) && (
                                  <option value={entry.position}>
                                    {entry.position}
                                  </option>
                                )}
                              {leadershipPositionOptions.map((position) => (
                                <option key={position} value={position}>
                                  {position}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-xs font-extrabold text-navy-900">
                            Category
                            <select
                              value={entry.category}
                              onChange={(event) =>
                                updateLeadershipEntry(
                                  index,
                                  'category',
                                  event.target.value,
                                )
                              }
                              className={inputClassName}
                            >
                              {leadershipCategories.map((category) => (
                                <option key={category}>{category}</option>
                              ))}
                            </select>
                          </label>
                          <label className="text-xs font-extrabold text-navy-900">
                            Term or school year
                            <input
                              value={entry.term}
                              onChange={(event) =>
                                updateLeadershipEntry(
                                  index,
                                  'term',
                                  event.target.value,
                                )
                              }
                              className={inputClassName}
                              placeholder="2024-2025"
                            />
                          </label>
                          <label className="text-xs font-extrabold text-navy-900 sm:col-span-2">
                            Description (optional)
                            <textarea
                              value={entry.description}
                              onChange={(event) =>
                                updateLeadershipEntry(
                                  index,
                                  'description',
                                  event.target.value,
                                )
                              }
                              className={`${inputClassName} min-h-20 resize-y`}
                              placeholder="Briefly describe the role or contribution."
                            />
                          </label>
                        </div>
                      </fieldset>
                    ))}
                  </div>
                )}
                <datalist id="alumni-leadership-organizations">
                  {leadershipOrganizationSuggestions.map((organization) => (
                    <option key={organization} value={organization} />
                  ))}
                </datalist>
              </section>

              <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-brand-50/35 p-5">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-brand-600 ring-1 ring-blue-100">
                  <ImageUp size={17} />
                  {selectedFile ? 'Choose another photo' : 'Choose profile photo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Selected alumni profile preview"
                    className="mx-auto mt-4 size-36 rounded-2xl object-cover"
                  />
                )}
                <p className="mt-3 text-center text-xs font-bold text-slate-500">
                  Profile photo is required before publishing. Use JPG, PNG, or
                  WebP under 8 MB.
                </p>
              </div>

              <PublishedPhotoPreview
                kind="profile"
                image={previewUrl}
                name={form.name}
                role={form.role}
                organization={form.organization}
                batch={form.batch}
                profileLabel="Alumni"
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-blue-300 bg-brand-50/45 p-4">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={form.isFeatured}
                    onChange={updateField}
                    className="mt-0.5 size-4 accent-blue-600"
                  />
                  <span className="text-sm font-extrabold text-navy-900">
                    Feature in Alumni Spotlight
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <input
                    type="checkbox"
                    name="consentConfirmed"
                    checked={form.consentConfirmed}
                    onChange={updateField}
                    className="mt-0.5 size-4 accent-emerald-600"
                  />
                  <span className="text-sm font-extrabold text-navy-900">
                    Publication consent confirmed
                  </span>
                </label>
              </div>

              {error && (
                <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={resetEditor}
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
                  {isSaving ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAlumni
