import {
  CheckCircle2,
  Clock3,
  Edit3,
  GraduationCap,
  LoaderCircle,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminListSkeleton from './AdminListSkeleton'
import useAuth from '../context/useAuth'
import { getYearLevelLabel, yearLevelOptions } from '../data/yearLevels'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import {
  getAdminProfiles,
  isProfilesRpcMissing,
  deleteAdminUser,
  updateAdminProfile,
} from '../lib/profiles'

const inputClassName =
  'admin-field mt-2 placeholder:text-slate-400'

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  suspended: 'bg-red-50 text-red-700 ring-red-200',
}

const statusFilters = [
  ['all', 'All statuses'],
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['suspended', 'Suspended'],
]

const roleFilters = [
  ['all', 'All roles'],
  ['student', 'Students'],
  ['faculty', 'Faculty'],
  ['editor', 'Editors'],
  ['admin', 'Admins'],
]

const yearLevelFilters = [
  ['all', 'All years'],
  ...yearLevelOptions.map(({ value, label }) => [value, label]),
]

function AdminUsers() {
  const { user, refreshProfile } = useAuth()
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedYearLevel, setSelectedYearLevel] = useState('all')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [needsSchema, setNeedsSchema] = useState(false)

  useBodyScrollLock(Boolean(editingItem))

  const loadProfiles = useCallback(async () => {
    setIsLoading(true)
    const { data, error: loadError } = await getAdminProfiles()

    if (loadError) {
      setError(loadError.message)
      setNeedsSchema(isProfilesRpcMissing(loadError))
    } else {
      setItems(data)
      setError('')
      setNeedsSchema(false)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true

    getAdminProfiles().then(({ data, error: loadError }) => {
      if (!isMounted) return
      if (loadError) {
        setError(loadError.message)
        setNeedsSchema(isProfilesRpcMissing(loadError))
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
      approved: items.filter((item) => item.status === 'approved').length,
      staff: items.filter(
        (item) => item.role === 'admin' || item.role === 'editor',
      ).length,
      pending: items.filter((item) => item.status === 'pending').length,
    }),
    [items],
  )

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return items.filter((item) => {
      const matchesStatus =
        selectedStatus === 'all' || item.status === selectedStatus
      const matchesRole = selectedRole === 'all' || item.role === selectedRole
      const matchesYearLevel =
        selectedYearLevel === 'all' || item.year_level === selectedYearLevel
      const matchesSearch =
        !query ||
        [
          item.full_name,
          item.email,
          item.student_number,
          item.year_level,
          item.role,
          item.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)

      return matchesStatus && matchesRole && matchesYearLevel && matchesSearch
    })
  }, [items, searchTerm, selectedRole, selectedStatus, selectedYearLevel])

  const openEditor = (item) => {
    setEditingItem(item)
    setShowDeleteConfirmation(false)
    setForm({
      fullName: item.full_name,
      studentNumber: item.student_number || '',
      yearLevel: item.year_level || '',
      role: item.role,
      status: item.status,
    })
    setError('')
    setSuccess('')
  }

  const closeEditor = () => {
    if (isSaving || isDeleting) return
    setEditingItem(null)
    setForm(null)
    setShowDeleteConfirmation(false)
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (showDeleteConfirmation) return
    setError('')

    if (!form.fullName.trim()) {
      setError('Full name is required.')
      return
    }

    setIsSaving(true)
    const { error: updateError } = await updateAdminProfile(
      editingItem.id,
      form,
    )

    if (updateError) {
      const schemaMissing = isProfilesRpcMissing(updateError)
      setNeedsSchema(schemaMissing)
      setError(
        schemaMissing
          ? 'Run supabase/users.sql in the Supabase SQL Editor, then refresh this page.'
          : updateError.message,
      )
      setIsSaving(false)
      return
    }

    if (editingItem.id === user.id) await refreshProfile()
    setIsSaving(false)
    closeEditor()
    setSuccess('Account profile updated.')
    await loadProfiles()
  }

  const requestDelete = () => {
    if (!editingItem || editingItem.id === user?.id) {
      setError('You cannot delete your own administrator account.')
      return
    }

    setError('')
    setShowDeleteConfirmation(true)
  }

  const handleDelete = async () => {
    if (!editingItem || editingItem.id === user?.id) return

    setError('')
    setIsDeleting(true)
    const { error: deleteError } = await deleteAdminUser(editingItem.id)

    if (deleteError) {
      setError(deleteError.message)
      setIsDeleting(false)
      return
    }

    const deletedName = editingItem.full_name || editingItem.email
    setIsDeleting(false)
    setShowDeleteConfirmation(false)
    setEditingItem(null)
    setForm(null)
    setSuccess(`Account for ${deletedName} was permanently deleted.`)
    await loadProfiles()
  }

  return (
    <div className="admin-page mx-auto max-w-7xl">
      <div>
        <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
          Access administration
        </p>
        <h2 className="mt-2 text-3xl font-black text-navy-900">
          Users & Roles
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Approve member accounts, suspend access, and assign student, faculty,
          editor, or administrator roles. Only administrators can open this
          module.
        </p>
      </div>

      {needsSchema && (
        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
          Run <code className="font-bold">supabase/users.sql</code> in the
          Supabase SQL Editor, then refresh this page.
        </div>
      )}

      {(error || success) && !needsSchema && !editingItem && (
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
          ['All accounts', counts.all, UsersRound],
          ['Approved', counts.approved, CheckCircle2],
          ['Staff roles', counts.staff, ShieldCheck],
          ['Pending', counts.pending, Clock3],
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

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="relative block">
            <span className="sr-only">Search users</span>
            <Search
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, email, student number, year level, role, or status"
              className="admin-search-field"
            />
          </label>
          <p className="rounded-full bg-slate-50 px-4 py-2 text-xs font-extrabold text-slate-500">
            Showing {filteredItems.length} of {items.length}
          </p>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div
            className="flex flex-wrap justify-center gap-2 sm:justify-start"
            aria-label="Filter by status"
          >
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
          <div
            className="flex flex-wrap justify-center gap-2 sm:justify-start lg:justify-end"
            aria-label="Filter by role"
          >
            {roleFilters.map(([value, label]) => {
              const isActive = selectedRole === value

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedRole(value)}
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
          <div
            className="flex flex-wrap justify-center gap-2 border-t border-slate-100 pt-3 sm:justify-start lg:col-span-2"
            aria-label="Filter by year level"
          >
            {yearLevelFilters.map(([value, label]) => {
              const isActive = selectedYearLevel === value

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedYearLevel(value)}
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
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {isLoading ? (
          <AdminListSkeleton label="Loading users" />
        ) : filteredItems.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <UserRound size={30} className="mx-auto text-brand-600" />
            <h3 className="mt-4 text-lg font-black text-navy-900">
              No matching accounts
            </h3>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredItems.map((item) => (
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
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold text-brand-600 uppercase">
                      {item.role}
                    </span>
                    {item.year_level && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-blue-700 uppercase">
                        {getYearLevelLabel(item.year_level)}
                      </span>
                    )}
                    {item.id === user.id && (
                      <span className="text-xs font-extrabold text-slate-400">
                        Your account
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 truncate text-lg font-black text-navy-900">
                    {item.full_name || 'Unnamed account'}
                  </h3>
                  <p className="mt-1 truncate text-sm text-slate-600">
                    {item.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.student_number || 'No student number'}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <GraduationCap size={14} aria-hidden="true" />
                    {getYearLevelLabel(item.year_level)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openEditor(item)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-extrabold text-slate-600"
                >
                  <Edit3 size={15} />
                  Manage
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {editingItem && form && (
        <div
          className="admin-modal-backdrop fixed inset-0 z-[70] overflow-y-auto bg-navy-950/70 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="User account editor"
        >
          <div className="mx-auto my-8 max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                  Account administration
                </p>
                <h3 className="mt-1 text-2xl font-black text-navy-900">
                  Manage user
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {editingItem.email}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500"
                aria-label="Close user editor"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-6 sm:px-7">
              <div className="grid gap-5">
                <label className="text-sm font-extrabold text-navy-900">
                  Full name
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={updateField}
                    className={inputClassName}
                    required
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900">
                  Student number
                  <input
                    name="studentNumber"
                    value={form.studentNumber}
                    onChange={updateField}
                    className={inputClassName}
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900">
                  Year level
                  <select
                    name="yearLevel"
                    value={form.yearLevel}
                    onChange={updateField}
                    className={inputClassName}
                  >
                    <option value="">Not set</option>
                    {yearLevelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-extrabold text-navy-900">
                  Role
                  <select
                    name="role"
                    value={form.role}
                    onChange={updateField}
                    disabled={editingItem.id === user.id}
                    className={inputClassName}
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </label>
                <label className="text-sm font-extrabold text-navy-900">
                  Account status
                  <select
                    name="status"
                    value={form.status}
                    onChange={updateField}
                    disabled={editingItem.id === user.id}
                    className={inputClassName}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </label>
              </div>

              {editingItem.id === user.id && (
                <p className="mt-5 rounded-xl border border-blue-300 bg-brand-50/45 px-4 py-3 text-sm leading-6 text-slate-600">
                  Your own role and status are locked to prevent accidental
                  loss of administrator access.
                </p>
              )}

              {error && (
                <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </p>
              )}

              {showDeleteConfirmation && (
                <div
                  className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4"
                  role="alert"
                >
                  <div className="flex gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-red-600 shadow-sm">
                      <Trash2 size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-red-800">
                        Delete this account permanently?
                      </p>
                      <p className="mt-1 text-sm leading-6 text-red-700">
                        This removes the user&apos;s sign-in account, profile, and
                        account-owned records. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirmation(false)}
                      disabled={isDeleting}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-extrabold text-red-700 disabled:opacity-60"
                    >
                      Keep account
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-60"
                    >
                      {isDeleting ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} aria-hidden="true" />
                      )}
                      {isDeleting ? 'Deleting...' : 'Delete permanently'}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-7 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {editingItem.id !== user?.id && !showDeleteConfirmation && (
                    <button
                      type="button"
                      onClick={requestDelete}
                      disabled={isSaving || isDeleting}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-extrabold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-60"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      Delete account
                    </button>
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEditor}
                    disabled={isDeleting}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-extrabold text-slate-600 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isDeleting || showDeleteConfirmation}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
                  >
                    {isSaving ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Save size={17} />
                    )}
                    {isSaving ? 'Saving...' : 'Save account'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
