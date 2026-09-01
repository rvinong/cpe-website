import {
  Building2,
  Camera,
  ChevronDown,
  CirclePlus,
  Edit3,
  History,
  ImageUp,
  LoaderCircle,
  Save,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import useOrganization from '../context/useOrganization'
import { organizationPositionOptions } from '../data/organizationPositions'
import {
  createMilestone,
  createOfficer,
  deleteMilestone,
  deleteOfficer,
  getOrganizationPersonPhotoUrl,
  isOrganizationSchemaMissing,
  removeOrganizationPersonPhoto,
  saveOrganizationProfile,
  updateMilestone,
  updateOfficer,
  uploadOrganizationPersonPhoto,
  validateOrganizationPersonPhoto,
} from '../lib/organization'
import PhotoCropEditor from './PhotoCropEditor'
import PublishedPhotoPreview from './PublishedPhotoPreview'

const inputClassName =
  'admin-field mt-2 placeholder:text-slate-400'

function PositionDropdown({ value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={rootRef} className="relative mt-2">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-required="true"
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (
            event.key === 'ArrowDown' ||
            event.key === 'Enter' ||
            event.key === ' '
          ) {
            event.preventDefault()
            setIsOpen(true)
          }
        }}
        className={`${inputClassName} flex items-center justify-between gap-3 text-left ${
          value ? '' : 'text-slate-400'
        }`}
      >
        <span className="truncate">{value || 'Select a position'}</span>
        <ChevronDown
          size={17}
          className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="position-dropdown-menu absolute inset-x-0 top-full z-30 mt-2 overflow-y-auto p-1"
          role="listbox"
          aria-label="Available positions"
        >
          {options.map((position) => (
            <button
              key={position}
              type="button"
              role="option"
              aria-selected={value === position}
              onClick={() => {
                onChange(position)
                setIsOpen(false)
              }}
              className="position-dropdown-option"
            >
              {position}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const emptyOfficer = {
  personType: 'officer',
  name: '',
  position: '',
  academicYear: '',
}

const emptyMilestone = {
  year: '',
  title: '',
  description: '',
  sortOrder: 0,
}

function AdminOrganization() {
  const {
    profile,
    membership,
    stats,
    officers,
    milestones,
    isLoading,
    error: contentError,
    refresh,
  } = useOrganization()
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [editorType, setEditorType] = useState(null)

  useBodyScrollLock(Boolean(editorType))
  const [editingItem, setEditingItem] = useState(null)
  const [officerForm, setOfficerForm] = useState(emptyOfficer)
  const [milestoneForm, setMilestoneForm] = useState(emptyMilestone)
  const [personPhotoFile, setPersonPhotoFile] = useState(null)
  const [personPhotoPreview, setPersonPhotoPreview] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const needsSchema = isOrganizationSchemaMissing(contentError)
  const positionOptions = organizationPositionOptions[officerForm.personType]
  const availablePositionOptions =
    officerForm.personType === 'faculty'
      ? positionOptions
      : officerForm.position && !positionOptions.includes(officerForm.position)
      ? [officerForm.position, ...positionOptions]
      : positionOptions

  useEffect(
    () => () => {
      if (personPhotoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(personPhotoPreview)
      }
    },
    [personPhotoPreview],
  )

  const clearPersonPhotoPreview = () => {
    if (personPhotoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(personPhotoPreview)
    }
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSaving(true)

    const data = Object.fromEntries(new FormData(event.currentTarget))
    const { error: saveError } = await saveOrganizationProfile(data)

    if (saveError) {
      setError(saveError.message)
      setIsSaving(false)
      return
    }

    await refresh()
    setSuccess('Organization profile updated.')
    setIsSaving(false)
  }

  const openOfficerEditor = (officer = null) => {
    clearPersonPhotoPreview()
    setEditorType('officer')
    setEditingItem(officer)
    setOfficerForm(
      officer
        ? {
            personType:
              officer.person_type || officer.personType || 'officer',
            name: officer.name,
            position:
              (officer.person_type || officer.personType) === 'faculty' &&
              String(officer.position || '').trim().toLowerCase() === 'adviser'
                ? 'Faculty'
                : officer.position,
            academicYear: officer.academic_year,
          }
        : emptyOfficer,
    )
    setPersonPhotoFile(null)
    setPersonPhotoPreview(
      officer?.photo ||
        getOrganizationPersonPhotoUrl(officer?.photo_path) ||
        '',
    )
    setError('')
    setSuccess('')
  }

  const openMilestoneEditor = (milestone = null) => {
    clearPersonPhotoPreview()
    setEditorType('milestone')
    setEditingItem(milestone)
    setMilestoneForm(
      milestone
        ? {
            year: milestone.year,
            title: milestone.title,
            description: milestone.description,
            sortOrder: milestone.sort_order,
          }
        : emptyMilestone,
    )
    setPersonPhotoFile(null)
    setPersonPhotoPreview('')
    setError('')
    setSuccess('')
  }

  const closeEditor = () => {
    if (isSaving) return
    clearPersonPhotoPreview()
    setEditorType(null)
    setEditingItem(null)
    setOfficerForm(emptyOfficer)
    setMilestoneForm(emptyMilestone)
    setPersonPhotoFile(null)
    setPersonPhotoPreview('')
  }

  const handlePersonPhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileError = validateOrganizationPersonPhoto(file)
    if (fileError) {
      setError(fileError)
      event.target.value = ''
      return
    }

    clearPersonPhotoPreview()
    setPersonPhotoFile(file)
    setPersonPhotoPreview(URL.createObjectURL(file))
    setError('')
    event.target.value = ''
  }

  const applyPersonPhotoCrop = ({ file, previewUrl: croppedPreviewUrl }) => {
    if (!croppedPreviewUrl) return

    clearPersonPhotoPreview()
    setPersonPhotoFile(file)
    setPersonPhotoPreview(croppedPreviewUrl)
    setError('')
  }

  const handleOfficerSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!officerForm.name.trim() || !officerForm.position.trim()) {
      setError('Name and position/title are required.')
      return
    }
    setIsSaving(true)
    let photoPath = editingItem?.photo_path || null
    let uploadedPath = null

    if (personPhotoFile) {
      const { data, error: uploadError } =
        await uploadOrganizationPersonPhoto(personPhotoFile)

      if (uploadError) {
        setError(uploadError.message)
        setIsSaving(false)
        return
      }

      uploadedPath = data.path
      photoPath = data.path
    }

    const result = editingItem
      ? await updateOfficer(editingItem.id, officerForm, photoPath)
      : await createOfficer(officerForm, photoPath)

    if (result.error) {
      if (uploadedPath) await removeOrganizationPersonPhoto(uploadedPath)
      setError(result.error.message)
      setIsSaving(false)
      return
    }

    if (
      uploadedPath &&
      editingItem?.photo_path &&
      editingItem.photo_path !== uploadedPath
    ) {
      await removeOrganizationPersonPhoto(editingItem.photo_path)
    }

    await refresh()
    setSuccess(editingItem ? 'Person updated.' : 'Person added.')
    clearPersonPhotoPreview()
    setIsSaving(false)
    setEditorType(null)
    setEditingItem(null)
    setOfficerForm(emptyOfficer)
    setPersonPhotoFile(null)
    setPersonPhotoPreview('')
  }

  const handleMilestoneSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (
      !milestoneForm.year.trim() ||
      !milestoneForm.title.trim() ||
      !milestoneForm.description.trim()
    ) {
      setError('Year, title, and description are required.')
      return
    }

    setIsSaving(true)
    const result = editingItem
      ? await updateMilestone(editingItem.id, milestoneForm)
      : await createMilestone(milestoneForm)

    if (result.error) {
      setError(result.error.message)
      setIsSaving(false)
      return
    }

    await refresh()
    setSuccess(editingItem ? 'Milestone updated.' : 'Milestone added.')
    setIsSaving(false)
    setEditorType(null)
    setEditingItem(null)
    setMilestoneForm(emptyMilestone)
  }

  const handleDeleteOfficer = async (officer) => {
    if (!window.confirm(`Remove ${officer.name} from the officer directory?`)) {
      return
    }

    const { error: deleteError } = await deleteOfficer(officer.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    if (officer.photo_path) {
      await removeOrganizationPersonPhoto(officer.photo_path)
    }
    await refresh()
    setSuccess('Person removed.')
  }

  const handleDeleteMilestone = async (milestone) => {
    if (!window.confirm(`Delete the "${milestone.title}" milestone?`)) return

    const { error: deleteError } = await deleteMilestone(milestone.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    await refresh()
    setSuccess('Milestone removed.')
  }

  return (
    <div className="admin-page mx-auto max-w-7xl">
      <div>
        <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
          Organization records
        </p>
        <h2 className="mt-2 text-3xl font-black text-navy-900">
          About Content
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Maintain the official profile, contact channels, membership
          guidance, leadership directory, history, and homepage figures.
        </p>
      </div>

      {needsSchema && (
        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-extrabold text-amber-900">
            Organization content setup required
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Run{' '}
            <code className="rounded bg-white px-1.5 py-1 font-bold">
              supabase/organization.sql
            </code>{' '}
            in the Supabase SQL Editor, then refresh this page.
          </p>
        </div>
      )}

      {(error || success) && !editorType && (
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

      <div className="mt-7 grid gap-2 rounded-xl border border-slate-200 bg-white p-1.5 sm:grid-cols-3">
        {[
          ['profile', 'Profile & Contact', Building2],
          ['officers', 'Officers & Faculty', UsersRound],
          ['history', 'History', History],
        ].map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setActiveTab(key)
              setError('')
              setSuccess('')
            }}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-extrabold transition ${
              activeTab === key
                ? 'bg-brand-600 text-white'
                : 'text-slate-500 hover:bg-brand-50 hover:text-brand-600'
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid min-h-72 place-items-center">
          <LoaderCircle
            size={30}
            className="animate-spin text-brand-600"
            aria-label="Loading organization content"
          />
        </div>
      ) : activeTab === 'profile' ? (
        <form
          key={`${profile.name}-${profile.overview}`}
          onSubmit={handleProfileSubmit}
          className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
        >
          <div className="grid gap-7">
            <fieldset>
              <legend className="text-lg font-black text-navy-900">
                Core profile
              </legend>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Organization name
                  <input
                    name="name"
                    defaultValue={profile.name}
                    className={inputClassName}
                    required
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Overview
                  <textarea
                    name="overview"
                    defaultValue={profile.overview}
                    className={`${inputClassName} min-h-32 resize-y leading-7`}
                    required
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900">
                  Mission
                  <textarea
                    name="mission"
                    defaultValue={profile.mission}
                    className={`${inputClassName} min-h-36 resize-y`}
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900">
                  Vision
                  <textarea
                    name="vision"
                    defaultValue={profile.vision}
                    className={`${inputClassName} min-h-36 resize-y`}
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Footer description
                  <textarea
                    name="footerDescription"
                    defaultValue={profile.footerDescription}
                    className={`${inputClassName} min-h-24 resize-y`}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="border-t border-slate-200 pt-7">
              <legend className="text-lg font-black text-navy-900">
                Homepage at a glance
              </legend>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Heading
                  <input
                    name="glanceHeading"
                    defaultValue={profile.glanceHeading}
                    className={inputClassName}
                    required
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Description
                  <textarea
                    name="glanceDescription"
                    defaultValue={profile.glanceDescription}
                    className={`${inputClassName} min-h-24 resize-y`}
                    required
                  />
                </label>
                {[
                  ['years', 'Years of Excellence', stats.years],
                  ['events', 'Events & Activities', stats.events],
                  ['members', 'Active Members', stats.members],
                  ['curriculumUnits', 'Curriculum Units', stats.curriculumUnits],
                  ['partners', 'Partners', stats.partners],
                ].map(([key, label, stat]) => (
                  <div
                    key={key}
                    className="grid grid-cols-[1fr_100px] gap-3 rounded-xl border border-slate-200 p-4"
                  >
                    <label className="text-sm font-extrabold text-navy-900">
                      {label}
                      <input
                        type="number"
                        min="0"
                        name={`${key}Value`}
                        defaultValue={stat.value}
                        className={inputClassName}
                      />
                    </label>
                    <label className="text-sm font-extrabold text-navy-900">
                      Suffix
                      <input
                        name={`${key}Suffix`}
                        defaultValue={stat.suffix}
                        className={inputClassName}
                        maxLength={4}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>

            <fieldset className="border-t border-slate-200 pt-7">
              <legend className="text-lg font-black text-navy-900">
                Contact & social channels
              </legend>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Campus address
                  <input
                    name="campusAddress"
                    defaultValue={profile.campusAddress}
                    className={inputClassName}
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900">
                  Contact email
                  <input
                    type="email"
                    name="contactEmail"
                    defaultValue={profile.contactEmail}
                    className={inputClassName}
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900">
                  Contact phone
                  <input
                    name="contactPhone"
                    defaultValue={profile.contactPhone}
                    className={inputClassName}
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Office hours
                  <input
                    name="officeHours"
                    defaultValue={profile.officeHours}
                    className={inputClassName}
                  />
                </label>
                {[
                  ['facebookUrl', 'Facebook URL', profile.facebookUrl],
                  ['instagramUrl', 'Instagram URL', profile.instagramUrl],
                  ['youtubeUrl', 'YouTube URL', profile.youtubeUrl],
                  ['linkedinUrl', 'LinkedIn URL', profile.linkedinUrl],
                ].map(([name, label, value]) => (
                  <label
                    key={name}
                    className="text-sm font-extrabold text-navy-900"
                  >
                    {label}
                    <input
                      type="url"
                      name={name}
                      defaultValue={value}
                      className={inputClassName}
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="border-t border-slate-200 pt-7">
              <legend className="text-lg font-black text-navy-900">
                Membership guidance
              </legend>
              <div className="mt-4 grid gap-5 md:grid-cols-3">
                {[
                  [
                    'membershipEligibility',
                    'Eligibility',
                    membership.eligibility,
                  ],
                  ['membershipProcess', 'Application process', membership.process],
                  [
                    'membershipRequirements',
                    'Requirements',
                    membership.requirements,
                  ],
                ].map(([name, label, value]) => (
                  <label
                    key={name}
                    className="text-sm font-extrabold text-navy-900"
                  >
                    {label}
                    <textarea
                      name={name}
                      defaultValue={value}
                      className={`${inputClassName} min-h-32 resize-y`}
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="mt-7 flex justify-end border-t border-slate-200 pt-6">
            <button
              type="submit"
              disabled={isSaving || needsSchema}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-brand-700 disabled:opacity-50"
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
      ) : (
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <h3 className="font-black text-navy-900">
                {activeTab === 'officers'
                  ? 'Officers & faculty directory'
                  : 'Organization milestones'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {activeTab === 'officers'
                  ? 'Ordered by official position'
                  : 'Displayed in ascending order'}
              </p>
            </div>
            <button
              type="button"
              disabled={needsSchema}
              onClick={() =>
                activeTab === 'officers'
                  ? openOfficerEditor()
                  : openMilestoneEditor()
              }
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
            >
              <CirclePlus size={16} />
              {activeTab === 'officers' ? 'Add person' : 'Add milestone'}
            </button>
          </div>

          {(activeTab === 'officers' ? officers : milestones).length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h3 className="text-lg font-black text-navy-900">
                No {activeTab === 'officers' ? 'officers' : 'milestones'} yet
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Add verified organization records when they are ready.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {(activeTab === 'officers' ? officers : milestones).map(
                (item) => (
                  <article
                    key={item.id}
                    className={`grid gap-4 px-5 py-5 sm:items-center sm:px-6 ${
                      activeTab === 'officers'
                        ? 'sm:grid-cols-[64px_1fr_auto]'
                        : 'sm:grid-cols-[1fr_auto]'
                    }`}
                  >
                    {activeTab === 'officers' && (
                      item.photo ? (
                        <img
                          src={item.photo}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="profile-image size-16 rounded-2xl object-cover"
                        />
                      ) : (
                        <span className="grid size-16 place-items-center rounded-2xl bg-brand-50 text-lg font-black text-brand-600 ring-1 ring-blue-100">
                          {item.initials}
                        </span>
                      )
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-extrabold text-brand-600">
                          {activeTab === 'officers'
                            ? item.position
                            : item.year}
                        </p>
                        {activeTab === 'officers' && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold text-slate-500 uppercase">
                            {item.person_type === 'faculty'
                              ? 'Faculty'
                              : 'Officer'}
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1 text-lg font-black text-navy-900">
                        {activeTab === 'officers' ? item.name : item.title}
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {activeTab === 'officers'
                          ? item.academic_year || 'Academic year not specified'
                          : item.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          activeTab === 'officers'
                            ? openOfficerEditor(item)
                            : openMilestoneEditor(item)
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-extrabold text-slate-600"
                      >
                        <Edit3 size={15} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          activeTab === 'officers'
                            ? handleDeleteOfficer(item)
                            : handleDeleteMilestone(item)
                        }
                        className="grid size-10 place-items-center rounded-lg border border-red-200 text-red-600"
                        aria-label={`Delete ${activeTab === 'officers' ? item.name : item.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>
      )}

      {editorType && (
        <div
          className="admin-modal-backdrop fixed inset-0 z-[70] overflow-y-auto bg-navy-950/70 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Organization record editor"
        >
          <div className="mx-auto my-8 max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                  Organization record
                </p>
                <h3 className="mt-1 text-2xl font-black text-navy-900">
                  {editingItem ? 'Update' : 'Add'}{' '}
                  {editorType === 'officer' ? 'person' : 'milestone'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500"
                aria-label="Close editor"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={
                editorType === 'officer'
                  ? handleOfficerSubmit
                  : handleMilestoneSubmit
              }
              className="px-5 py-6 sm:px-7"
            >
              <div className="grid gap-5">
                {editorType === 'officer' ? (
                  <>
                    <label className="text-sm font-extrabold text-navy-900">
                      Profile type
                      <select
                        value={officerForm.personType}
                        onChange={(event) =>
                          setOfficerForm((current) => ({
                            ...current,
                            personType: event.target.value,
                            position: '',
                          }))
                        }
                        className={inputClassName}
                      >
                        <option value="officer">Student officer</option>
                        <option value="faculty">Faculty / adviser</option>
                      </select>
                    </label>
                    <label className="text-sm font-extrabold text-navy-900">
                      Full name
                      <input
                        value={officerForm.name}
                        onChange={(event) =>
                          setOfficerForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        className={inputClassName}
                        required
                      />
                    </label>
                    <label className="text-sm font-extrabold text-navy-900">
                      Position
                      <PositionDropdown
                        value={officerForm.position}
                        options={availablePositionOptions}
                        onChange={(position) =>
                          setOfficerForm((current) => ({
                            ...current,
                            position,
                          }))
                        }
                      />
                    </label>
                    <label className="text-sm font-extrabold text-navy-900">
                      Academic year
                      <input
                        value={officerForm.academicYear}
                        onChange={(event) =>
                          setOfficerForm((current) => ({
                            ...current,
                            academicYear: event.target.value,
                          }))
                        }
                        className={inputClassName}
                        placeholder="2026-2027"
                      />
                    </label>

                    <div className="rounded-2xl border border-dashed border-blue-200 bg-brand-50/35 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        {personPhotoPreview ? (
                          <img
                            src={personPhotoPreview}
                            alt="Selected profile preview"
                            className="profile-image h-36 w-28 rounded-3xl object-cover object-center"
                          />
                        ) : (
                          <span className="grid h-36 w-28 place-items-center rounded-3xl bg-white text-2xl font-black text-brand-600 ring-1 ring-blue-100">
                            {officerForm.name
                              .split(/\s+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join('')
                              .toUpperCase() || <UserRound size={28} />}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-extrabold text-navy-900">
                            Profile photo (optional)
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Use a clear JPG, PNG, or WebP image under 8 MB.
                            Without a photo, the person&apos;s initials will be
                            shown instead.
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-brand-600 ring-1 ring-blue-100">
                              {personPhotoPreview ? (
                                <Camera size={17} />
                              ) : (
                                <ImageUp size={17} />
                              )}
                              {personPhotoPreview
                                ? 'Change photo'
                                : 'Choose photo'}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handlePersonPhotoChange}
                                className="sr-only"
                              />
                            </label>
                            {personPhotoPreview && (
                              <PhotoCropEditor
                                image={personPhotoPreview}
                                sourceFile={personPhotoFile}
                                aspectRatio={4 / 5}
                                title="Adjust profile photo"
                                label="Edit crop"
                                fileName={
                                  personPhotoFile?.name || officerForm.name
                                }
                                disabled={isSaving}
                                onApply={applyPersonPhotoCrop}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <PublishedPhotoPreview
                      kind="profile"
                      image={personPhotoPreview}
                      name={officerForm.name}
                      role={officerForm.position}
                      academicYear={officerForm.academicYear}
                      profilePortrait
                      profileLabel={
                        officerForm.personType === 'faculty'
                          ? 'Faculty'
                          : 'Officer'
                      }
                    />
                  </>
                ) : (
                  <>
                    <label className="text-sm font-extrabold text-navy-900">
                      Year
                      <input
                        value={milestoneForm.year}
                        onChange={(event) =>
                          setMilestoneForm((current) => ({
                            ...current,
                            year: event.target.value,
                          }))
                        }
                        className={inputClassName}
                        placeholder="2026"
                        required
                      />
                    </label>
                    <label className="text-sm font-extrabold text-navy-900">
                      Title
                      <input
                        value={milestoneForm.title}
                        onChange={(event) =>
                          setMilestoneForm((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        className={inputClassName}
                        required
                      />
                    </label>
                    <label className="text-sm font-extrabold text-navy-900">
                      Description
                      <textarea
                        value={milestoneForm.description}
                        onChange={(event) =>
                          setMilestoneForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        className={`${inputClassName} min-h-32 resize-y`}
                        required
                      />
                    </label>
                  </>
                )}

                {editorType === 'milestone' && (
                  <label className="text-sm font-extrabold text-navy-900">
                    Display order
                    <input
                      type="number"
                      min="0"
                      value={milestoneForm.sortOrder}
                      onChange={(event) =>
                        setMilestoneForm((current) => ({
                          ...current,
                          sortOrder: event.target.value,
                        }))
                      }
                      className={inputClassName}
                    />
                  </label>
                )}
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrganization
