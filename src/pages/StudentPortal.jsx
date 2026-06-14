import { motion as Motion } from 'framer-motion'
import {
  BookOpen,
  Clock3,
  Download,
  Files,
  FlaskConical,
  GraduationCap,
  Landmark,
  LibraryBig,
  LoaderCircle,
  LockKeyhole,
  NotebookText,
  PlayCircle,
  ScrollText,
  ShieldCheck,
  Target,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import CurriculumTable from '../components/CurriculumTable'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import useAuth from '../context/useAuth'
import {
  curriculumMeta,
  curriculumYears,
  electiveTracks,
  programBackground,
  programOutcomes,
} from '../data/curriculum'
import { resourceCategories } from '../data/resources'
import {
  createResourceDownload,
  formatFileSize,
  getPublishedResources,
} from '../lib/resources'

const resourceIconMap = {
  files: Files,
  notebook: NotebookText,
  flask: FlaskConical,
  play: PlayCircle,
}

function StudentPortal() {
  const { user, profile, isApprovedMember } = useAuth()
  const [resources, setResources] = useState([])
  const [resourceOwnerId, setResourceOwnerId] = useState('')
  const [resourceError, setResourceError] = useState('')
  const [selectedYearId, setSelectedYearId] = useState(curriculumYears[0].id)
  const [selectedTermId, setSelectedTermId] = useState(
    curriculumYears[0].terms[0].id,
  )

  const selectedYear =
    curriculumYears.find((year) => year.id === selectedYearId) ??
    curriculumYears[0]
  const selectedTerm =
    selectedYear.terms.find((term) => term.id === selectedTermId) ??
    selectedYear.terms[0]

  const selectYear = (year) => {
    setSelectedYearId(year.id)
    setSelectedTermId(year.terms[0].id)
  }

  useEffect(() => {
    if (!isApprovedMember) return undefined

    let isMounted = true
    getPublishedResources().then(({ data, error }) => {
      if (!isMounted) return
      if (error) {
        setResourceError(error.message)
      } else {
        setResources(data)
        setResourceError('')
      }
      setResourceOwnerId(user.id)
    })

    return () => {
      isMounted = false
    }
  }, [isApprovedMember, user])

  const isLoadingResources =
    isApprovedMember && resourceOwnerId !== user?.id

  const openResource = async (resource) => {
    setResourceError('')
    const resourceWindow = window.open('about:blank', '_blank')
    if (resourceWindow) resourceWindow.opener = null

    const { data, error } = await createResourceDownload(resource)
    if (error) {
      resourceWindow?.close()
      setResourceError(error.message)
      return
    }
    if (resourceWindow) {
      resourceWindow.location.replace(data.signedUrl)
    } else {
      window.location.assign(data.signedUrl)
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-[72px]">
        <section className="relative isolate overflow-hidden border-b border-blue-100 bg-gradient-to-br from-white via-brand-50/70 to-blue-100/60 py-20 sm:py-24 lg:py-28">
          <div className="subtle-grid absolute inset-0 -z-20 opacity-60" />
          <div className="absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-brand-100/70 blur-3xl" />
          <div className="section-shell grid items-center gap-12 lg:grid-cols-[1fr_auto]">
            <Motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-xs font-extrabold tracking-[0.22em] text-brand-600 uppercase">
                Academic access
              </p>
              <h1 className="mt-4 text-5xl font-black tracking-[-0.055em] text-navy-900 sm:text-6xl">
                Student Portal
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Access organization learning resources and explore the
                Computer Engineering curriculum by year and semester.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#resources"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-brand-700"
                >
                  <LibraryBig size={18} aria-hidden="true" />
                  Resources
                </a>
                <a
                  href="#curriculum"
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white/85 px-5 py-3.5 text-sm font-extrabold text-navy-900 transition hover:border-brand-500 hover:text-brand-600"
                >
                  <GraduationCap size={18} aria-hidden="true" />
                  Curriculum
                </a>
              </div>
            </Motion.div>

            <Motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.65, delay: 0.12 }}
              className="relative hidden size-48 place-items-center rounded-[2.25rem] border border-white/80 bg-white/75 text-brand-600 shadow-[0_28px_70px_-36px_rgba(21,94,239,0.55)] backdrop-blur lg:grid"
              aria-hidden="true"
            >
              <span className="absolute inset-5 rounded-[1.7rem] border border-dashed border-blue-200" />
              <BookOpen size={68} strokeWidth={1.35} />
              <ShieldCheck
                size={25}
                className="absolute right-8 top-8 text-emerald-500"
              />
            </Motion.div>
          </div>
        </section>

        <section id="resources" className="scroll-mt-22 bg-white py-20 sm:py-24">
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              className="max-w-2xl"
            >
              <p className="text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
                Learning materials
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                Resources
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Approved organization members can open published reviewers,
                notes, laboratory manuals, and tutorials from this private
                library.
              </p>
            </Motion.div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {resourceCategories.map((resource, index) => {
                const Icon = resourceIconMap[resource.icon]

                return (
                  <Motion.article
                    key={resource.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: index * 0.06 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.32)]"
                  >
                    <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-lg font-extrabold text-navy-900">
                      {resource.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {resource.description}
                    </p>
                    <p className="mt-5 border-t border-slate-100 pt-4 text-xs font-bold text-slate-400">
                      {
                        resources.filter(
                          (item) => item.category === resource.id,
                        ).length
                      }{' '}
                      published
                    </p>
                  </Motion.article>
                )
              })}
            </div>

            {!user ? (
              <div className="mt-10 rounded-3xl border border-blue-100 bg-brand-50/45 px-6 py-10 text-center sm:px-10">
                <LockKeyhole
                  size={30}
                  className="mx-auto text-brand-600"
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-2xl font-black text-navy-900">
                  Member sign-in required
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
                  Sign in with your organization account to view and download
                  approved learning resources.
                </p>
                <a
                  href="/account?redirect=%2Fstudent-portal%23resources"
                  className="mt-6 inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white"
                >
                  Sign in to access resources
                </a>
              </div>
            ) : !isApprovedMember ? (
              <div className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 px-6 py-10 text-center sm:px-10">
                <Clock3
                  size={30}
                  className="mx-auto text-amber-700"
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-2xl font-black text-navy-900">
                  Account approval required
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
                  Your account is currently {profile?.status || 'pending'}.
                  An administrator must approve it before private resources
                  become available.
                </p>
              </div>
            ) : isLoadingResources ? (
              <div className="grid min-h-56 place-items-center">
                <LoaderCircle
                  size={30}
                  className="animate-spin text-brand-600"
                  aria-label="Loading student resources"
                />
              </div>
            ) : resources.length === 0 ? (
              <div className="mt-10 rounded-3xl border border-dashed border-blue-200 px-6 py-12 text-center">
                <Files
                  size={30}
                  className="mx-auto text-brand-600"
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-xl font-black text-navy-900">
                  No resources published yet
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Approved learning files will appear here when they are ready.
                </p>
              </div>
            ) : (
              <div className="mt-10 grid gap-5 md:grid-cols-2">
                {resources.map((resource) => {
                  const category = resourceCategories.find(
                    (item) => item.id === resource.category,
                  )

                  return (
                    <article
                      key={resource.id}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.28)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-extrabold text-brand-600">
                          {category?.title || resource.category}
                        </span>
                        {resource.course_code && (
                          <span className="text-xs font-extrabold text-slate-400">
                            {resource.course_code}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-4 text-xl font-black text-navy-900">
                        {resource.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {resource.description || category?.description}
                      </p>
                      <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                        <span className="text-xs font-bold text-slate-400">
                          {resource.external_url
                            ? 'External resource'
                            : [
                                resource.file_name,
                                formatFileSize(resource.file_size),
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => openResource(resource)}
                          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-extrabold text-white"
                        >
                          <Download size={15} />
                          Open
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {resourceError && (
              <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {resourceError}
              </p>
            )}
          </div>
        </section>

        <section
          id="program-foundation"
          className="scroll-mt-22 bg-navy-950 py-20 text-white sm:py-24"
        >
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"
            >
              <div className="max-w-3xl">
                <p className="text-xs font-extrabold tracking-[0.2em] text-blue-300 uppercase">
                  Academic record
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  Program Foundation
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-300">
                  Key approvals and curriculum milestones of the Bachelor of
                  Science in Computer Engineering program.
                </p>
              </div>
              <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-blue-200">
                <Landmark size={26} aria-hidden="true" />
              </span>
            </Motion.div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {programBackground.map((record, index) => (
                <Motion.article
                  key={record.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.07 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.07] p-6"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-blue-200">
                    <ScrollText size={21} aria-hidden="true" />
                  </span>
                  <p className="mt-5 text-xs font-extrabold tracking-wide text-blue-300 uppercase">
                    {record.date}
                  </p>
                  <h3 className="mt-2 text-xl font-black">{record.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {record.description}
                  </p>
                </Motion.article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="curriculum"
          className="scroll-mt-22 bg-slate-50/70 py-20 sm:py-24"
        >
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"
            >
              <div className="max-w-3xl">
                <p className="text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
                  Curriculum guide
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                  {curriculumMeta.program}
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  {curriculumMeta.track} · Implementation{' '}
                  {curriculumMeta.implementation}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-blue-100 bg-white px-4 py-4 text-center">
                  <strong className="block text-2xl font-black text-navy-900">
                    4
                  </strong>
                  <span className="text-xs font-bold text-slate-500">
                    Years
                  </span>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-white px-4 py-4 text-center">
                  <strong className="block text-2xl font-black text-navy-900">
                    {curriculumMeta.totalUnits}
                  </strong>
                  <span className="text-xs font-bold text-slate-500">
                    Units
                  </span>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-white px-4 py-4 text-center">
                  <strong className="block text-2xl font-black text-navy-900">
                    {electiveTracks.length}
                  </strong>
                  <span className="text-xs font-bold text-slate-500">
                    Tracks
                  </span>
                </div>
              </div>
            </Motion.div>

            <Motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mt-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.4)] sm:p-6"
            >
              <div
                role="tablist"
                aria-label="Curriculum year"
                className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 sm:grid-cols-4"
              >
                {curriculumYears.map((year) => {
                  const isActive = selectedYear.id === year.id

                  return (
                    <button
                      key={year.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => selectYear(year)}
                      className={`rounded-xl px-4 py-3 text-sm font-extrabold transition ${
                        isActive
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'text-slate-600 hover:text-navy-900'
                      }`}
                    >
                      {year.shortLabel}
                    </button>
                  )
                })}
              </div>

              <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.15em] text-brand-600 uppercase">
                    {selectedYear.label}
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-navy-900">
                    {selectedTerm.label}
                  </h3>
                </div>
                <div
                  role="tablist"
                  aria-label={`${selectedYear.label} term`}
                  className="flex flex-wrap gap-2"
                >
                  {selectedYear.terms.map((term) => {
                    const isActive = selectedTerm.id === term.id

                    return (
                      <button
                        key={term.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setSelectedTermId(term.id)}
                        className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                          isActive
                            ? 'bg-brand-600 text-white'
                            : 'border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
                        }`}
                      >
                        {term.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div
                role="tabpanel"
                className="mt-6"
                aria-label={`${selectedYear.label}, ${selectedTerm.label}`}
              >
                <CurriculumTable term={selectedTerm} />
              </div>

              <div className="mt-5 flex flex-col gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="font-bold text-slate-600">
                  {selectedTerm.courses.length} courses in this term
                </span>
                <span className="font-black text-brand-600">
                  {selectedTerm.totalUnits} total units
                </span>
              </div>
            </Motion.div>

            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              className="mt-14"
            >
              <div className="max-w-2xl">
                <p className="text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
                  Cognates and electives
                </p>
                <h3 className="mt-3 text-2xl font-black text-navy-900 sm:text-3xl">
                  Elective Tracks
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Each listed elective course is shown as a three-hour course
                  in the supplied curriculum sheet.
                </p>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {electiveTracks.map((track, index) => (
                  <Motion.article
                    key={track.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.45, delay: index * 0.05 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                        <GraduationCap
                          size={21}
                          strokeWidth={1.7}
                          aria-hidden="true"
                        />
                      </span>
                      <h4 className="font-extrabold text-navy-900">
                        {track.title}
                      </h4>
                    </div>
                    <ul className="mt-5 space-y-3">
                      {track.courses.map((course) => (
                        <li
                          key={course}
                          className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 text-sm text-slate-600 first:border-0 first:pt-0"
                        >
                          <span>{course}</span>
                          <span className="shrink-0 text-xs font-extrabold text-brand-600">
                            3 hrs
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Motion.article>
                ))}
              </div>
            </Motion.div>

            <p className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
              This guide is based on the supplied curriculum sheet. Students
              should confirm enrollment requirements and curriculum updates
              with the College of Engineering and Technology.
            </p>
          </div>
        </section>

        <section
          id="program-outcomes"
          className="scroll-mt-22 bg-white py-20 sm:py-24"
        >
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              className="max-w-3xl"
            >
              <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <Target size={26} aria-hidden="true" />
              </span>
              <p className="mt-6 text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
                Graduate competencies
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                Program Outcomes
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                By graduation, students are expected to demonstrate the
                following engineering knowledge, skills, and professional
                capabilities.
              </p>
            </Motion.div>

            <ol className="mt-10 grid gap-4 md:grid-cols-2">
              {programOutcomes.map((outcome, index) => (
                <Motion.li
                  key={outcome}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: (index % 2) * 0.04 }}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-7 text-slate-600">
                    {outcome}
                  </p>
                </Motion.li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default StudentPortal
