import { motion as Motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  Images,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import useAlumni from '../hooks/useAlumni'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

const yearbookHighlights = [
  {
    icon: GraduationCap,
    label: 'Batch archive',
    value: 'By year',
  },
  {
    icon: ShieldCheck,
    label: 'Verified records',
    value: 'Approved only',
  },
  {
    icon: BriefcaseBusiness,
    label: 'Career stories',
    value: 'After campus',
  },
]

function AlumniSection() {
  const { profiles, isLoading } = useAlumni()
  const previewProfiles = profiles.slice(0, 4)

  return (
    <section
      id="alumni"
      className="relative isolate overflow-hidden bg-white py-24 sm:py-32"
    >
      <div className="subtle-grid absolute inset-0 -z-20 opacity-60" />
      <div className="absolute -left-24 top-24 -z-10 size-72 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="absolute -bottom-24 right-10 -z-10 size-80 rounded-full bg-orange-300/15 blur-3xl" />
      <div className="section-shell">
        <Reveal>
          <SectionHeader
            eyebrow="Graduate archive"
            title="Alumni Yearbook Preview"
            description="A growing digital archive for verified graduates, batches, and stories from the NwSSU Computer Engineering community."
          />
        </Reveal>

        <Reveal delay={0.08} direction="right">
          <div className="surface-card relative isolate overflow-hidden p-6 sm:p-9 lg:p-12">
            <div className="absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-brand-500/10 blur-3xl" />
            <div className="absolute -bottom-28 left-10 -z-10 size-72 rounded-full bg-orange-300/20 blur-3xl" />

            <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-brand-50 px-3 py-1.5 text-xs font-extrabold text-brand-600">
                  <BookOpen size={14} aria-hidden="true" />
                  Digital archive
                </span>
                <h3 className="mt-5 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                  Every batch, one shared history
                </h3>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                  Alumni records are currently being collected and verified.
                  Approved graduate profiles will be published in the
                  yearbook as they become available.
                </p>
                <p className="mt-5 max-w-xl rounded-2xl border border-blue-100 bg-white/80 p-4 text-sm font-bold leading-7 text-slate-600 shadow-sm shadow-blue-950/[0.03]">
                  Preserving the people, projects, and milestones that shaped
                  the CpE community.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {yearbookHighlights.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                        <Icon size={19} aria-hidden="true" />
                      </span>
                      <p className="mt-3 text-[0.68rem] font-extrabold tracking-[0.14em] text-slate-400 uppercase">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-black text-navy-900">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <Motion.a
                  href="/alumni"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.985 }}
                  className="primary-button mt-7"
                >
                  Open alumni yearbook
                  <ArrowRight size={17} aria-hidden="true" />
                </Motion.a>
              </div>

              <div className="relative">
                <div className="absolute -left-4 top-10 hidden h-32 w-5 rounded-full bg-brand-600/80 shadow-lg shadow-blue-600/20 lg:block" />
                <div className="absolute -right-5 bottom-16 hidden h-24 w-24 rounded-[2rem] border border-orange-200 bg-orange-50/80 rotate-6 lg:block" />

                <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-blue-50/65 to-orange-50/55 p-5 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.65)]">
                  <div className="subtle-grid absolute inset-0 opacity-55" />
                  <div className="relative mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
                        Yearbook spread
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-500">
                        {isLoading
                          ? 'Loading profiles...'
                          : `${previewProfiles.length} preview profiles`}
                      </p>
                    </div>
                    <span className="grid size-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-blue-100">
                      <Sparkles size={20} aria-hidden="true" />
                    </span>
                  </div>

                  {previewProfiles.length > 0 ? (
                    <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2">
                      {previewProfiles.map((profile, index) => {
                        const rotation =
                          index % 4 === 0
                            ? '-rotate-2'
                            : index % 4 === 1
                              ? 'rotate-2'
                              : index % 4 === 2
                                ? 'rotate-1'
                                : '-rotate-1'

                        return (
                          <article
                            key={profile.id}
                            className={`group relative rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-[0_20px_55px_-38px_rgba(15,23,42,0.55)] transition duration-300 hover:z-10 hover:-translate-y-2 hover:rotate-0 hover:border-brand-400 ${rotation}`}
                          >
                            <span className="absolute -right-2 top-4 z-10 rounded-l-full bg-orange-500 px-3 py-1 text-[0.62rem] font-black text-white shadow-md shadow-orange-500/20">
                              {profile.batch || 'TBA'}
                            </span>
                            <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-blue-400">
                              {profile.photo || profile.photo_path ? (
                                <img
                                  src={profile.photo || profile.photo_path}
                                  alt={profile.name}
                                  loading="lazy"
                                  decoding="async"
                                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="grid h-full place-items-center">
                                  <div className="grid size-20 place-items-center rounded-full border border-white/20 bg-white/10 text-xl font-black text-white shadow-inner shadow-white/10">
                                    {profile.initials ||
                                      profile.name
                                        ?.split(' ')
                                        .map((part) => part[0])
                                        .join('')
                                        .slice(0, 2) ||
                                      `A${index + 1}`}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
                              <h4 className="truncate text-sm font-black text-navy-900">
                                {profile.name}
                              </h4>
                              <p className="mt-0.5 truncate text-xs font-bold text-slate-500">
                                {profile.role || profile.professional_role || 'Graduate'}
                              </p>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="relative rounded-2xl border border-dashed border-blue-200 bg-white/80 p-8 text-center">
                      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                        <Images size={24} aria-hidden="true" />
                      </div>
                      <h4 className="mt-4 text-sm font-black text-navy-900">
                        Alumni profiles are being prepared
                      </h4>
                      <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-slate-500">
                        Verified graduate cards will appear here once the
                        archive is ready.
                      </p>
                    </div>
                  )}

                  <div className="relative mt-5 rounded-2xl border border-blue-100 bg-white/80 p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-xl bg-navy-900 text-white">
                        <BookOpen size={20} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-black text-navy-900">
                          Modern archive, familiar memories
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Built for verified graduate records, batch browsing,
                          and future alumni stories.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default AlumniSection
