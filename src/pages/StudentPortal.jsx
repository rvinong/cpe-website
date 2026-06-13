import { motion as Motion } from 'framer-motion'
import {
  BookOpen,
  Files,
  FlaskConical,
  GraduationCap,
  LibraryBig,
  NotebookText,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import CurriculumTable from '../components/CurriculumTable'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import {
  curriculumMeta,
  curriculumYears,
  electiveTracks,
} from '../data/curriculum'
import { resourceCategories } from '../data/resources'

const resourceIconMap = {
  files: Files,
  notebook: NotebookText,
  flask: FlaskConical,
  play: PlayCircle,
}

function StudentPortal() {
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
                Resource categories are ready. Verified files can be added
                here once they are provided by the organization.
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
                      No files uploaded yet
                    </p>
                  </Motion.article>
                )
              })}
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
      </main>
      <Footer />
    </>
  )
}

export default StudentPortal
