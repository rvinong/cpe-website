import {
  Award,
  CirclePlus,
  Edit3,
  GraduationCap,
  ImageUp,
  LoaderCircle,
  Save,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import AdminListSkeleton from './AdminListSkeleton'
import { signalBytePublished } from '../lib/byteAssistant'
import {
  createAlumniProfile,
  deleteAlumniProfile,
  getAdminAlumni,
  isAlumniSchemaMissing,
  removeAlumniPhoto,
  updateAlumniProfile,
  uploadAlumniPhoto,
  validateAlumniPhoto,
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
  sortOrder: 0,
}

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
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [needsSchema, setNeedsSchema] = useState(false)

  useBodyScrollLock(isEditorOpen)

  const loadAlumni = useCallback(async () => {
    setIsLoading(true)
    const { data, error: loadError } = await getAdminAlumni()

    if (loadError) {
      setError(loadError.message)
      setNeedsSchema(isAlumniSchemaMissing(loadError))
    } else {
      setItems(data)
      setError('')
      setNeedsSchema(false)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true

    getAdminAlumni().then(({ data, error: loadError }) => {
      if (!isMounted) return
      if (loadError) {
        setError(loadError.message)
        setNeedsSchema(isAlumniSchemaMissing(loadError))
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

  const resetEditor = () => {
    if (isSaving) return
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setIsEditorOpen(false)
    setEditingItem(null)
    setForm(emptyForm)
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
            sortOrder: item.sort_order,
          }
        : emptyForm,
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
    if (form.status === 'published' && !form.consentConfirmed) {
      setError('Confirm publication consent before publishing this profile.')
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
          <div className="divide-y divide-slate-200">
            {items.map((item) => (
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
                    <span className="text-xs font-bold text-slate-500">
                      Batch {item.batch}
                    </span>
                    {item.is_featured && (
                      <span className="text-xs font-extrabold text-amber-600">
                        Spotlight
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 truncate text-lg font-black text-navy-900">
                    {item.name}
                  </h3>
                  <p className="mt-1 truncate text-sm text-slate-600">
                    {[item.professional_role, item.organization]
                      .filter(Boolean)
                      .join(' at ') || 'Career details not supplied'}
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
                  Spotlight note
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
              </div>

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
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-blue-100 bg-brand-50/45 p-4">
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
