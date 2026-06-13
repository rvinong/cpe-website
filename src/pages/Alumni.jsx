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
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { alumniProfiles } from '../data/alumni'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('All batches')

  const batches = useMemo(
    () =>
      [...new Set(alumniProfiles.map((profile) => profile.batch))].sort(
        (first, second) => second.localeCompare(first),
      ),
    [],
  )

  const filteredProfiles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return alumniProfiles.filter((profile) => {
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
  }, [searchTerm, selectedBatch])

  const featuredProfiles = useMemo(
    () => alumniProfiles.filter((profile) => profile.featured),
    [],
  )

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
                Digital graduate archive
              </p>
              <h1 className="mt-4 text-5xl font-black tracking-[-0.055em] text-navy-900 sm:text-6xl">
                Alumni Yearbook
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Explore the people and batches that helped shape the NwSSU
                Computer Engineering community.
              </p>
            </Motion.div>

            <Motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.65, delay: 0.12 }}
              className="relative hidden size-48 place-items-center rounded-[2.25rem] border border-white/80 bg-white/75 text-brand-600 shadow-[0_28px_70px_-36px_rgba(21,94,239,0.55)] backdrop-blur lg:grid"
              aria-hidden="true"
            >
              <span className="absolute inset-5 rounded-[1.7rem] border border-dashed border-blue-200" />
              <BookOpen size={67} strokeWidth={1.35} />
              <GraduationCap
                size={27}
                className="absolute right-7 top-8 text-blue-300"
              />
            </Motion.div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55 }}
              className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.35)] sm:p-6 md:grid-cols-[1fr_15rem]"
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
                  className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-12 pr-4 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                />
              </label>

              <label htmlFor="batch-filter">
                <span className="sr-only">Filter alumni by batch</span>
                <select
                  id="batch-filter"
                  value={selectedBatch}
                  onChange={(event) => setSelectedBatch(event.target.value)}
                  className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-bold text-navy-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
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
                  value: alumniProfiles.length,
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

            {featuredProfiles.length === 0 ? (
              <Motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.07] px-6 py-12 text-center backdrop-blur-sm sm:px-10"
              >
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white/10 text-blue-200">
                  <Award size={29} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-2xl font-black text-white">
                  Spotlight nominations are being collected
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">
                  Featured graduates will appear here after their information
                  has been verified and approved for publication.
                </p>
              </Motion.div>
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
                    className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {profile.photo ? (
                        <img
                          src={profile.photo}
                          alt=""
                          className="size-16 rounded-2xl object-cover"
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

            {filteredProfiles.length === 0 && (
              <Motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="mx-auto mt-10 max-w-3xl rounded-3xl border border-dashed border-blue-200 bg-white px-6 py-14 text-center shadow-[0_24px_70px_-50px_rgba(15,23,42,0.38)] sm:px-10"
              >
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <Inbox size={28} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-2xl font-black text-navy-900">
                  Yearbook records are being collected
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
                  No verified alumni profiles have been published yet.
                  Graduate records and batch photos will be added as the
                  organization completes its archive.
                </p>
              </Motion.div>
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
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.32)]"
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
      <Footer />
    </>
  )
}

export default Alumni
