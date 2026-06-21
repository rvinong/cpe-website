import {
  Building2,
  CirclePlus,
  Edit3,
  History,
  LoaderCircle,
  Save,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import useOrganization from '../context/useOrganization'
import {
  createMilestone,
  createOfficer,
  deleteMilestone,
  deleteOfficer,
  isOrganizationSchemaMissing,
  saveOrganizationProfile,
  updateMilestone,
  updateOfficer,
} from '../lib/organization'

const inputClassName =
  'admin-field mt-2 placeholder:text-slate-400'

const emptyOfficer = {
  name: '',
  position: '',
  academicYear: '',
  sortOrder: 0,
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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const needsSchema = isOrganizationSchemaMissing(contentError)

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
    setEditorType('officer')
    setEditingItem(officer)
    setOfficerForm(
      officer
        ? {
            name: officer.name,
            position: officer.position,
            academicYear: officer.academic_year,
            sortOrder: officer.sort_order,
          }
        : emptyOfficer,
    )
    setError('')
    setSuccess('')
  }

  const openMilestoneEditor = (milestone = null) => {
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
    setError('')
    setSuccess('')
  }

  const closeEditor = () => {
    if (isSaving) return
    setEditorType(null)
    setEditingItem(null)
    setOfficerForm(emptyOfficer)
    setMilestoneForm(emptyMilestone)
  }

  const handleOfficerSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!officerForm.name.trim() || !officerForm.position.trim()) {
      setError('Officer name and position are required.')
      return
    }

    setIsSaving(true)
    const result = editingItem
      ? await updateOfficer(editingItem.id, officerForm)
      : await createOfficer(officerForm)

    if (result.error) {
      setError(result.error.message)
      setIsSaving(false)
      return
    }

    await refresh()
    setSuccess(editingItem ? 'Officer updated.' : 'Officer added.')
    setIsSaving(false)
    setEditorType(null)
    setEditingItem(null)
    setOfficerForm(emptyOfficer)
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
    await refresh()
    setSuccess('Officer removed.')
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
          ['officers', 'Officers', UsersRound],
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
                  ? 'Officer directory'
                  : 'Organization milestones'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Displayed in ascending order
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
              {activeTab === 'officers' ? 'Add officer' : 'Add milestone'}
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
                    className="grid gap-4 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-brand-600">
                        {activeTab === 'officers'
                          ? item.position
                          : item.year}
                      </p>
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
          <div className="mx-auto my-8 max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                  Organization record
                </p>
                <h3 className="mt-1 text-2xl font-black text-navy-900">
                  {editingItem ? 'Update' : 'Add'}{' '}
                  {editorType === 'officer' ? 'officer' : 'milestone'}
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
                      <input
                        value={officerForm.position}
                        onChange={(event) =>
                          setOfficerForm((current) => ({
                            ...current,
                            position: event.target.value,
                          }))
                        }
                        className={inputClassName}
                        required
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

                <label className="text-sm font-extrabold text-navy-900">
                  Display order
                  <input
                    type="number"
                    min="0"
                    value={
                      editorType === 'officer'
                        ? officerForm.sortOrder
                        : milestoneForm.sortOrder
                    }
                    onChange={(event) =>
                      editorType === 'officer'
                        ? setOfficerForm((current) => ({
                            ...current,
                            sortOrder: event.target.value,
                          }))
                        : setMilestoneForm((current) => ({
                            ...current,
                            sortOrder: event.target.value,
                          }))
                    }
                    className={inputClassName}
                  />
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
