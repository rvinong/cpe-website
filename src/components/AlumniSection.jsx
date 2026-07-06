import { motion as Motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import useAlumni from '../hooks/useAlumni'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

const yearbookHighlights = [
  {
    icon: GraduationCap,
    title: 'Organized by batch',
    description: 'Graduate profiles will be grouped by graduation year.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified records',
    description: 'Only approved information will be added to the archive.',
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

            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
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

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-inner shadow-blue-950/[0.03]">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
                      Yearbook cards
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {isLoading
                        ? 'Loading profiles...'
                        : `${previewProfiles.length} preview profiles`}
                    </p>
                  </div>
                  <span className="grid size-11 place-items-center rounded-2xl bg-white text-brand-600 ring-1 ring-blue-100">
                    <Sparkles size={20} aria-hidden="true" />
                  </span>
                </div>

                {previewProfiles.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                    {previewProfiles.map((profile, index) => (
                      <article
                        key={profile.id}
                        className="group rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-1 hover:border-brand-400 hover:shadow-[0_18px_45px_-30px_rgba(21,94,239,0.45)]"
                      >
                        <div className="aspect-[4/5] overflow-hidden rounded-xl bg-brand-600">
                          {profile.photo || profile.photo_path ? (
                            <img
                              src={profile.photo || profile.photo_path}
                              alt={profile.name}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-lg font-black text-white">
                              {profile.initials ||
                                profile.name
                                  ?.split(' ')
                                  .map((part) => part[0])
                                  .join('')
                                  .slice(0, 2) ||
                                `A${index + 1}`}
                            </div>
                          )}
                        </div>
                        <h4 className="mt-3 truncate text-sm font-black text-navy-900">
                          {profile.name}
                        </h4>
                        <p className="mt-0.5 truncate text-xs font-bold text-slate-500">
                          Batch {profile.batch || 'TBA'}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-blue-200 bg-white/80 p-6 text-center">
                    <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                      <GraduationCap size={22} aria-hidden="true" />
                    </div>
                    <h4 className="mt-4 text-sm font-black text-navy-900">
                      Alumni profiles are being prepared
                    </h4>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Verified graduate cards will appear here once the archive
                      is ready.
                    </p>
                  </div>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {yearbookHighlights.map(({ icon: Icon, title, description }) => (
                    <article
                      key={title}
                      className="rounded-2xl border border-blue-100 bg-white/85 p-4"
                    >
                      <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      <h4 className="mt-3 text-sm font-extrabold text-navy-900">
                        {title}
                      </h4>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {description}
                      </p>
                    </article>
                  ))}
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
