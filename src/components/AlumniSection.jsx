import { useMemo } from 'react'
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

const yearbookHighlights = [
  {
    icon: GraduationCap,
    label: 'Batch directory',
    value: 'By graduation year',
  },
  {
    icon: ShieldCheck,
    label: 'Verified profiles',
    value: 'Reviewed records',
  },
  {
    icon: BriefcaseBusiness,
    label: 'Approved details',
    value: 'Official entries',
  },
]

function getRandomPreviewProfiles(profiles) {
  const randomizedProfiles = [...profiles]

  for (let index = randomizedProfiles.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const currentProfile = randomizedProfiles[index]

    randomizedProfiles[index] = randomizedProfiles[randomIndex]
    randomizedProfiles[randomIndex] = currentProfile
  }

  return randomizedProfiles.slice(0, 4)
}

function AlumniSection() {
  const { profiles, isLoading } = useAlumni()
  const previewProfiles = useMemo(
    () => getRandomPreviewProfiles(profiles),
    [profiles],
  )

  return (
    <section
      id="alumni"
      className="alumni-home-section relative isolate overflow-hidden py-24 sm:py-32"
    >
      <div className="subtle-grid absolute inset-0 -z-20 opacity-20 dark:opacity-20" />
      <div className="alumni-home-glow alumni-home-glow-primary absolute -left-24 top-24 -z-10 size-72 rounded-full blur-3xl" />
      <div className="alumni-home-glow alumni-home-glow-accent absolute -bottom-24 right-10 -z-10 size-80 rounded-full blur-3xl" />
      <div className="section-shell">
        <Reveal>
          <div className="mb-9 max-w-2xl sm:mb-12">
            <p className="alumni-home-eyebrow mb-4 text-[11px] font-extrabold tracking-[0.22em] uppercase">
              Alumni records
            </p>
            <h2 className="alumni-home-title text-3xl font-black tracking-[-0.05em] sm:text-5xl sm:tracking-[-0.055em]">
              Computer Engineering Alumni Directory
            </h2>
            <p className="alumni-home-copy mt-5 text-base leading-7">
              An official directory for verified Computer Engineering graduates,
              organized by batch and maintained with approved alumni information.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08} direction="right">
          <div className="alumni-home-shell relative isolate overflow-hidden p-6 sm:p-9 lg:p-12">
            <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <span className="alumni-home-badge inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold">
                  <BookOpen size={14} aria-hidden="true" />
                  Official alumni archive
                </span>
                <h3 className="alumni-home-subtitle mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                  Verified alumni profiles by batch
                </h3>
                <p className="alumni-home-copy mt-4 max-w-xl text-base leading-7">
                  Browse published alumni records by graduation year, including
                  approved profile details submitted for the organization archive.
                </p>
                <p className="alumni-home-callout mt-5 max-w-xl rounded-2xl p-4 text-sm font-bold leading-7">
                  All entries are reviewed before publication to ensure accurate,
                  respectful, and authorized alumni information.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {yearbookHighlights.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="alumni-home-stat-card rounded-2xl p-4"
                    >
                      <span className="alumni-home-stat-icon grid size-10 place-items-center rounded-xl">
                        <Icon size={19} aria-hidden="true" />
                      </span>
                      <p className="alumni-home-stat-label mt-3 text-[0.68rem] font-extrabold tracking-[0.14em] uppercase">
                        {label}
                      </p>
                      <p className="alumni-home-stat-value mt-1 text-sm font-black">
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
                  View alumni directory
                  <ArrowRight size={17} aria-hidden="true" />
                </Motion.a>
              </div>

              <div className="relative">
                <div className="alumni-home-preview relative overflow-hidden rounded-[2rem] p-5">
                  <div className="alumni-home-preview-corner absolute right-0 top-0 h-28 w-28 rounded-bl-[4rem]" />
                  <div className="relative mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="alumni-home-preview-label text-xs font-extrabold tracking-[0.2em] uppercase">
                        Directory preview
                      </p>
                      <p className="alumni-home-preview-meta mt-1 text-sm font-bold">
                        {isLoading
                          ? 'Loading profiles...'
                          : `${previewProfiles.length} verified profiles`}
                      </p>
                    </div>
                    <span className="alumni-home-preview-icon grid size-12 place-items-center rounded-2xl">
                      <Sparkles size={20} aria-hidden="true" />
                    </span>
                  </div>

                  {previewProfiles.length > 0 ? (
                    <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2">
                      {previewProfiles.map((profile, index) => {
                        const rotation =
                          index % 4 === 0
                            ? 'lg:-rotate-1'
                            : index % 4 === 1
                              ? 'lg:rotate-1'
                              : index % 4 === 2
                                ? 'lg:rotate-1'
                                : 'lg:-rotate-1'

                        return (
                          <article
                            key={profile.id}
                            className={`alumni-home-profile-card group relative rounded-[1.35rem] p-3 transition duration-300 hover:z-10 hover:-translate-y-2 hover:rotate-0 ${rotation}`}
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
                            <div className="alumni-home-profile-name mt-3 rounded-xl px-3 py-2">
                              <h4 className="alumni-home-profile-title truncate text-sm font-black">
                                {profile.name}
                              </h4>
                              <p className="alumni-home-profile-role mt-0.5 truncate text-xs font-bold">
                                {profile.role || profile.professional_role || 'Graduate'}
                              </p>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="alumni-home-empty relative rounded-2xl p-8 text-center">
                      <div className="alumni-home-empty-icon mx-auto grid size-14 place-items-center rounded-2xl">
                        <Images size={24} aria-hidden="true" />
                      </div>
                      <h4 className="alumni-home-empty-title mt-4 text-sm font-black">
                        Alumni profiles are being prepared
                      </h4>
                      <p className="alumni-home-empty-copy mx-auto mt-2 max-w-xs text-xs leading-5">
                        Verified graduate cards will appear here once the
                        archive is ready.
                      </p>
                    </div>
                  )}

                  <div className="alumni-home-preview-note relative mt-5 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <span className="alumni-home-note-icon grid size-11 place-items-center rounded-xl">
                        <BookOpen size={20} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="alumni-home-note-title text-sm font-black">
                          Official profiles will appear here
                        </p>
                        <p className="alumni-home-note-copy mt-1 text-xs leading-5">
                          Published entries may include approved photos, batch
                          information, and professional details when available.
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
