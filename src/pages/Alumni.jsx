import { motion as Motion } from 'framer-motion'
import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  Inbox,
  Search,
  UsersRound,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import ContentSkeleton from '../components/ContentSkeleton'
import EmptyState from '../components/EmptyState'
import PageHero from '../components/PageHero'
import { alumniProfiles as sampleAlumniProfiles } from '../data/alumni'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import useAlumni from '../hooks/useAlumni'

function compareAlumniNames(first, second) {
  return (first.name || '').localeCompare(second.name || '', undefined, {
    sensitivity: 'base',
  })
}

function getSpotlightScore(profile) {
  // Admin selections lead; profile details provide a deterministic fallback.
  return (
    (profile.featured ? 1000 : 0) +
    (profile.highlight?.trim() ? 40 : 0) +
    Math.min(profile.leadership?.length || 0, 3) * 20 +
    (profile.role?.trim() ? 15 : 0) +
    (profile.organization?.trim() ? 10 : 0)
  )
}

function Alumni() {
  const { profiles, isLoading } = useAlumni()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedProfile, setSelectedProfile] = useState(null)
  const isUsingSampleProfiles = !isLoading && profiles.length === 0
  const displayedProfiles = isUsingSampleProfiles
    ? sampleAlumniProfiles
    : profiles
  useBodyScrollLock(Boolean(selectedProfile))

  const batches = useMemo(
    () =>
      [...new Set(displayedProfiles.map((profile) => profile.batch))].sort(
        (first, second) => second.localeCompare(first),
      ),
    [displayedProfiles],
  )

  const activeBatch = batches.includes(selectedBatch)
    ? selectedBatch
    : batches[0] || ''

  const filteredProfiles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return displayedProfiles
      .filter((profile) => {
        const matchesBatch = !activeBatch || profile.batch === activeBatch
        const matchesSearch =
          !normalizedSearch ||
          [profile.name, profile.batch, profile.role, profile.organization]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch)

        return matchesBatch && matchesSearch
      })
      .sort(compareAlumniNames)
  }, [activeBatch, displayedProfiles, searchTerm])

  const featuredProfiles = useMemo(
    () =>
      displayedProfiles
        .slice()
        .sort((first, second) => {
          const scoreDifference =
            getSpotlightScore(second) - getSpotlightScore(first)
          return scoreDifference || compareAlumniNames(first, second)
        })
        .slice(0, 3),
    [displayedProfiles],
  )

  return (
    <>
      <main className="pt-[84px]">
        <PageHero
          eyebrow="Digital graduate archive"
          title="Alumni Yearbook"
          description="Explore the people and batches that helped shape the NwSSU Computer Engineering community."
          icon={BookOpen}
          accentIcon={GraduationCap}
        />

        <section className="bg-white py-14 sm:py-16">
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55 }}
              className="filter-panel grid gap-4 md:grid-cols-[1fr_15rem]"
            >
              <label className="relative block" htmlFor="alumni-search">
                <span className="sr-only">Search alumni</span>
                <Search
                  size={20}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="alumni-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search alumni by name..."
                  className="field-control pl-12 pr-4 placeholder:text-slate-400"
                />
              </label>

              <label htmlFor="batch-filter">
                <span className="sr-only">Filter alumni by batch</span>
                <select
                  id="batch-filter"
                  value={activeBatch}
                  onChange={(event) => setSelectedBatch(event.target.value)}
                  className="field-control px-4 font-bold"
                  disabled={batches.length === 0}
                >
                  {batches.map((batch) => (
                    <option key={batch}>{batch}</option>
                  ))}
                </select>
              </label>
            </Motion.div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                {
                  label: 'Verified profiles',
                  value: displayedProfiles.length,
                  icon: UsersRound,
                },
                {
                  label: 'Available batches',
                  value: batches.length,
                  icon: GraduationCap,
                },
              ].map(({ label, value, icon: Icon }, index) => (
                <Motion.article
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="flex items-center gap-4 rounded-2xl border border-blue-300 bg-brand-50/45 p-5"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-blue-100">
                    <Icon size={21} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xl font-black text-navy-900">{value}</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-500">
                      {label}
                    </p>
                  </div>
                </Motion.article>
              ))}
            </div>

            {isUsingSampleProfiles && (
              <p className="mt-5 rounded-2xl border border-blue-300 bg-brand-50/45 px-4 py-3 text-center text-xs font-extrabold tracking-[0.12em] text-brand-600 uppercase">
                Sample preview - replace these with verified alumni profiles in
                the dashboard.
              </p>
            )}
          </div>
        </section>

        <section className="bg-navy-950 py-20 sm:py-24">
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-2xl text-center"
            >
              <p className="text-xs font-extrabold tracking-[0.2em] text-blue-300 uppercase">
                Graduate recognition
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Alumni Spotlight
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Recognizing graduates for their professional work, community
                involvement, and continued connection with the organization.
              </p>
            </Motion.div>

            {isLoading ? (
              <ContentSkeleton
                count={3}
                tone="dark"
                className="mt-10"
                label="Loading alumni spotlights"
              />
            ) : featuredProfiles.length === 0 ? (
              <EmptyState
                icon={Award}
                tone="dark"
                className="mt-10"
                title="Spotlight nominations are being collected"
                description="Featured graduates will appear here after their information has been verified and approved for publication."
              />
            ) : (
              <div className="mt-10 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredProfiles.map((profile, index) => (
                  <Motion.article
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: index * 0.07 }}
                    className="interactive-card flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] backdrop-blur-sm"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-brand-600">
                      {profile.photo ? (
                        <img
                          src={profile.photo}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="profile-image h-full w-full object-cover"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center bg-brand-600 text-4xl font-black text-white">
                          {profile.initials}
                        </span>
                      )}
                      <span className="absolute right-4 top-4 rounded-full border border-white/15 bg-navy-950/75 px-3 py-1.5 text-xs font-bold text-blue-100 backdrop-blur-sm">
                        {profile.batch}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="h-[7.5rem] shrink-0 overflow-hidden">
                        <h3 className="h-16 overflow-hidden text-2xl font-extrabold leading-8 text-white line-clamp-2">
                          {profile.name}
                        </h3>
                        <p className="mt-2 h-5 overflow-hidden text-sm font-bold leading-5 text-blue-200 line-clamp-1">
                          {profile.role || ' '}
                        </p>
                        <p className="mt-1 h-5 overflow-hidden text-sm leading-5 text-slate-400 line-clamp-1">
                          {profile.organization || ' '}
                        </p>
                      </div>
                      {profile.highlight && (
                        <div className="mt-6 border-t border-white/10 pt-5">
                          <p className="text-xs font-extrabold tracking-[0.16em] text-blue-300 uppercase">
                            Achievements
                          </p>
                          <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm leading-6 text-slate-300">
                            {profile.highlight}
                          </p>
                        </div>
                      )}
                    </div>
                  </Motion.article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-slate-50/70 py-20 sm:py-24">
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-2xl text-center"
            >
              <p className="text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
                Graduate directory
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                Browse the Yearbook
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                A compact portrait archive for verified graduates. Select a
                portrait to view the approved profile details.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {batches.map((batch) => (
                  <button
                    key={batch}
                    type="button"
                    onClick={() => setSelectedBatch(batch)}
                    aria-pressed={activeBatch === batch}
                    className={`filter-chip ${
                      activeBatch === batch ? 'filter-chip-active' : ''
                    }`}
                  >
                    Batch {batch}
                  </button>
                ))}
              </div>
            </Motion.div>

            {isLoading ? (
              <ContentSkeleton
                count={6}
                className="mt-10"
                label="Loading alumni directory"
              />
            ) : filteredProfiles.length === 0 ? (
              <EmptyState
                icon={Inbox}
                className="mt-10"
                title="Yearbook records are being collected"
                description="No verified alumni profiles have been published yet. Graduate records and batch photos will be added as the organization completes its archive."
              />
            ) : (
              <div className="surface-card relative mt-10 overflow-hidden rounded-[2rem] bg-white/90 p-5 sm:p-8">
                <div className="subtle-grid absolute inset-0 opacity-60" />
                <div className="relative">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                      Showing Batch {activeBatch}
                    </p>
                    <p className="text-xs font-bold text-slate-500">
                      {filteredProfiles.length}{' '}
                      {filteredProfiles.length === 1 ? 'profile' : 'profiles'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 items-stretch gap-5 sm:grid-cols-3 lg:grid-cols-4">
                    {filteredProfiles.map((profile, index) => (
                      <Motion.button
                        key={profile.id}
                        type="button"
                        onClick={() => setSelectedProfile(profile)}
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        viewport={{ once: true, amount: 0.18 }}
                        transition={{
                          duration: 0.38,
                          delay: Math.min(index * 0.018, 0.18),
                        }}
                        className="group flex h-full min-h-[21rem] flex-col rounded-2xl border border-slate-200 bg-white/75 p-3 text-center shadow-[0_18px_40px_-30px_rgba(15,23,42,0.42)] transition hover:border-brand-500/60 hover:shadow-[0_22px_48px_-30px_rgba(21,94,239,0.42)]"
                        aria-label={`Open ${profile.name}'s alumni profile`}
                      >
                        <span className="mx-auto block aspect-[3/4] w-full max-w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.42)] transition group-hover:scale-[1.015]">
                          {profile.photo ? (
                            <img
                              src={profile.photo}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <span className="grid h-full w-full place-items-center bg-brand-600 text-xl font-black text-white">
                              {profile.initials}
                            </span>
                          )}
                        </span>
                        <span className="mt-3 flex min-h-[7rem] flex-1 flex-col items-center">
                          <span className="line-clamp-2 min-h-10 text-sm font-extrabold leading-5 text-navy-900 transition group-hover:text-brand-600 sm:text-base">
                            {profile.name}
                          </span>
                          <span className="mt-1 block truncate text-xs font-bold text-brand-600">
                            Batch {profile.batch}
                          </span>
                          <span className="mt-0.5 block min-h-4 w-full truncate text-xs font-bold text-slate-500">
                            {profile.role || ''}
                          </span>
                          <span className="mt-2 flex min-h-8 items-start justify-center">
                            {profile.leadership?.length > 0 && (
                              <span className="inline-flex max-w-full items-center justify-center rounded-full bg-violet-50 px-2 py-1 text-[0.58rem] font-extrabold leading-4 text-violet-700 ring-1 ring-violet-100 sm:text-[0.62rem]">
                                Leadership background
                              </span>
                            )}
                          </span>
                        </span>
                      </Motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

      </main>

      {selectedProfile && (
        <div
          className="fixed inset-0 z-[70] overflow-y-auto bg-navy-950/75 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedProfile.name} alumni profile`}
          onClick={() => setSelectedProfile(null)}
        >
          <Motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22 }}
            className="mx-auto my-8 max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative bg-navy-950 p-6 text-white sm:p-8">
              <div className="subtle-grid absolute inset-0 opacity-10" />
              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
                className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Close alumni profile"
              >
                <X size={19} aria-hidden="true" />
              </button>

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end">
                <div className="aspect-[3/4] w-36 overflow-hidden rounded-2xl border border-white/10 bg-navy-900 shadow-2xl sm:w-44">
                  {selectedProfile.photo ? (
                    <img
                      src={selectedProfile.photo}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center bg-brand-600 text-4xl font-black">
                      {selectedProfile.initials}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold tracking-[0.18em] text-blue-300 uppercase">
                    Batch {selectedProfile.batch}
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                    {selectedProfile.name}
                  </h2>
                  {(selectedProfile.role || selectedProfile.organization) && (
                    <p className="mt-3 text-sm font-bold text-blue-100">
                      {[selectedProfile.role, selectedProfile.organization]
                        .filter(Boolean)
                        .join(' at ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:p-8">
              {selectedProfile.leadership?.length > 0 && (
                <section className="rounded-2xl border border-violet-200 bg-violet-50/45 p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-violet-600 shadow-sm ring-1 ring-violet-200">
                      <BriefcaseBusiness size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-extrabold tracking-[0.16em] text-violet-700 uppercase">
                        Leadership background
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Roles held in the department, college, and student
                        organizations.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {selectedProfile.leadership
                      .filter(
                        (entry) => entry.organization && entry.position,
                      )
                      .map((entry, index) => (
                        <article
                          key={entry.id || `${entry.organization}-${index}`}
                          className="rounded-xl border border-violet-200 bg-white p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-black text-navy-900">
                                {entry.position}
                              </h3>
                              <p className="mt-1 text-sm font-bold text-violet-700">
                                {entry.organization}
                              </p>
                            </div>
                            {entry.category && (
                              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-extrabold text-violet-700 ring-1 ring-violet-100">
                                {entry.category}
                              </span>
                            )}
                          </div>
                          {entry.term && (
                            <p className="mt-3 text-xs font-extrabold tracking-wide text-slate-500 uppercase">
                              {entry.term}
                            </p>
                          )}
                          {entry.description && (
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {entry.description}
                            </p>
                          )}
                        </article>
                      ))}
                  </div>
                </section>
              )}
              {selectedProfile.highlight && (
                <div className="rounded-2xl border border-blue-300 bg-brand-50/45 p-5">
                  <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                    Achievements
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                    {selectedProfile.highlight}
                  </p>
                </div>
              )}
              <p className="text-xs font-bold leading-5 text-slate-500">
                Only approved public details are shown in the alumni yearbook.
              </p>
            </div>
          </Motion.div>
        </div>
      )}
    </>
  )
}

export default Alumni

