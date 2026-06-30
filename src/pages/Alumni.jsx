import { motion as Motion } from 'framer-motion'
import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  Image,
  Inbox,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import ContentSkeleton from '../components/ContentSkeleton'
import EmptyState from '../components/EmptyState'
import PageHero from '../components/PageHero'
import { alumniProfiles as sampleAlumniProfiles } from '../data/alumni'
import useAlumni from '../hooks/useAlumni'

const profileDetails = [
  {
    icon: UserRound,
    title: 'Graduate name',
    description: 'The alumnus or alumna’s approved full name.',
  },
  {
    icon: GraduationCap,
    title: 'Graduation batch',
    description: 'The year the graduate completed the program.',
  },
  {
    icon: Image,
    title: 'Profile photo',
    description: 'A clear photo provided with permission for publication.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Career information',
    description: 'Current role or professional field, when provided.',
  },
  {
    icon: Building2,
    title: 'Organization history',
    description: 'Former position or involvement in the organization.',
  },
  {
    icon: ShieldCheck,
    title: 'Approved details',
    description: 'Only information cleared for the public archive.',
  },
]

function Alumni() {
  const { profiles, isLoading } = useAlumni()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('All batches')
  const isUsingSampleProfiles = !isLoading && profiles.length === 0
  const displayedProfiles = isUsingSampleProfiles
    ? sampleAlumniProfiles
    : profiles

  const batches = useMemo(
    () =>
      [...new Set(displayedProfiles.map((profile) => profile.batch))].sort(
        (first, second) => second.localeCompare(first),
      ),
    [displayedProfiles],
  )

  const filteredProfiles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return displayedProfiles.filter((profile) => {
      const matchesBatch =
        selectedBatch === 'All batches' || profile.batch === selectedBatch
      const matchesSearch =
        !normalizedSearch ||
        [profile.name, profile.batch, profile.role, profile.organization]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)

      return matchesBatch && matchesSearch
    })
  }, [displayedProfiles, searchTerm, selectedBatch])

  const featuredProfiles = useMemo(
    () => displayedProfiles.filter((profile) => profile.featured),
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
                  value={selectedBatch}
                  onChange={(event) => setSelectedBatch(event.target.value)}
                  className="field-control px-4 font-bold"
                >
                  <option>All batches</option>
                  {batches.map((batch) => (
                    <option key={batch}>{batch}</option>
                  ))}
                </select>
              </label>
            </Motion.div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
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
                {
                  label: 'Publication standard',
                  value: 'Approved',
                  icon: ShieldCheck,
                },
              ].map(({ label, value, icon: Icon }, index) => (
                <Motion.article
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-brand-50/45 p-5"
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
              <p className="mt-5 rounded-2xl border border-blue-100 bg-brand-50/45 px-4 py-3 text-center text-xs font-extrabold tracking-[0.12em] text-brand-600 uppercase">
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
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredProfiles.map((profile, index) => (
                  <Motion.article
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: index * 0.07 }}
                    className="interactive-card rounded-2xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {profile.photo ? (
                        <img
                          src={profile.photo}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="profile-image size-16 rounded-2xl object-cover"
                        />
                      ) : (
                        <span className="grid size-16 place-items-center rounded-2xl bg-brand-600 text-lg font-black text-white">
                          {profile.initials}
                        </span>
                      )}
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-blue-100">
                        {profile.batch}
                      </span>
                    </div>
                    <h3 className="mt-6 text-xl font-extrabold text-white">
                      {profile.name}
                    </h3>
                    {profile.role && (
                      <p className="mt-2 text-sm font-bold text-blue-200">
                        {profile.role}
                      </p>
                    )}
                    {profile.organization && (
                      <p className="mt-1 text-sm text-slate-400">
                        {profile.organization}
                      </p>
                    )}
                    {profile.highlight && (
                      <p className="mt-5 border-t border-white/10 pt-5 text-sm leading-6 text-slate-300">
                        {profile.highlight}
                      </p>
                    )}
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
                Profiles will appear here after graduate details have been
                checked and approved for publication.
              </p>
            </Motion.div>

            {isLoading ? (
              <ContentSkeleton
                count={3}
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
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProfiles.map((profile, index) => (
                  <Motion.article
                    key={profile.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.45, delay: index * 0.04 }}
                    className="surface-card interactive-card p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {profile.photo ? (
                        <img
                          src={profile.photo}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="profile-image size-16 rounded-2xl object-cover"
                        />
                      ) : (
                        <span className="grid size-16 place-items-center rounded-2xl bg-brand-600 text-lg font-black text-white">
                          {profile.initials}
                        </span>
                      )}
                      <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-extrabold text-brand-600">
                        Batch {profile.batch}
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-black text-navy-900">
                      {profile.name}
                    </h3>
                    {profile.role && (
                      <p className="mt-2 text-sm font-extrabold text-brand-600">
                        {profile.role}
                      </p>
                    )}
                    {profile.organization && (
                      <p className="mt-1 text-sm text-slate-500">
                        {profile.organization}
                      </p>
                    )}
                    {profile.history && (
                      <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
                        {profile.history}
                      </p>
                    )}
                  </Motion.article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <p className="text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
                Profile information
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                What the yearbook will include
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Each entry stays focused on useful, verified graduate
                information.
              </p>
            </Motion.div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {profileDetails.map(
                ({ icon: Icon, title, description }, index) => (
                  <Motion.article
                    key={title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.5, delay: index * 0.055 }}
                    className="surface-card interactive-card p-6"
                  >
                    <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-lg font-extrabold text-navy-900">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {description}
                    </p>
                  </Motion.article>
                ),
              )}
            </div>

            <Motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5 }}
              className="mt-12 rounded-3xl bg-navy-950 px-6 py-10 text-center text-white shadow-[0_30px_80px_-44px_rgba(7,21,47,0.8)] sm:px-10"
            >
              <ShieldCheck
                size={30}
                className="mx-auto text-blue-300"
                aria-hidden="true"
              />
              <h2 className="mt-4 text-2xl font-black">
                Built with alumni privacy in mind
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Personal and professional details should only be published
                after the graduate has granted permission and the organization
                has verified the record.
              </p>
            </Motion.div>
          </div>
        </section>
      </main>
    </>
  )
}

export default Alumni
