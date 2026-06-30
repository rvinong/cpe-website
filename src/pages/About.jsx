import { motion as Motion } from 'framer-motion'
import {
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  ExternalLink,
  FileCheck2,
  Flag,
  GraduationCap,
  Handshake,
  History,
  Lightbulb,
  Mail,
  MapPin,
  Network,
  ShieldCheck,
  Target,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react'
import PageHero from '../components/PageHero'
import useOrganization from '../context/useOrganization'

const involvementAreas = [
  {
    icon: BookOpenCheck,
    title: 'Academic support',
    description:
      'A shared space for curriculum information, learning resources, and student guidance.',
  },
  {
    icon: Lightbulb,
    title: 'Technical growth',
    description:
      'Activities can support practical learning across hardware, software, networks, and emerging technologies.',
  },
  {
    icon: UsersRound,
    title: 'Student community',
    description:
      'The organization brings Computer Engineering students together through participation and collaboration.',
  },
  {
    icon: Handshake,
    title: 'Professional connection',
    description:
      'Alumni, industry, and academic connections can help students prepare for opportunities beyond campus.',
  },
]

const officialRecords = [
  {
    icon: Flag,
    title: 'Official mission',
    key: 'mission',
    emptyMessage:
      "The organization's approved mission statement has not been provided yet.",
  },
  {
    icon: Target,
    title: 'Official vision',
    key: 'vision',
    emptyMessage:
      "The organization's approved vision statement has not been provided yet.",
  },
]

const membershipItems = [
  {
    icon: UserRoundCheck,
    title: 'Eligibility',
    key: 'eligibility',
    emptyMessage: 'Official member eligibility guidelines are being collected.',
  },
  {
    icon: FileCheck2,
    title: 'Application process',
    key: 'process',
    emptyMessage: 'The confirmed registration process will be posted here.',
  },
  {
    icon: ShieldCheck,
    title: 'Requirements',
    key: 'requirements',
    emptyMessage: 'Membership requirements and policies are awaiting approval.',
  },
]

function About() {
  const {
    profile: organizationProfile,
    membership: membershipDetails,
    officers: organizationOfficers,
    milestones: historyMilestones,
  } = useOrganization()
  const populatedOfficialRecords = officialRecords.map((record) => ({
    ...record,
    value: organizationProfile[record.key],
  }))
  const populatedMembershipItems = membershipItems.map((item) => ({
    ...item,
    value: membershipDetails[item.key],
  }))

  return (
    <>
      <main className="pt-[84px]">
        <PageHero
          eyebrow="Who we are"
          title="About the Organization"
          description={`Learn about the community, purpose, leadership, membership, and official records of the ${organizationProfile.name}.`}
          icon={Building2}
          accentIcon={Network}
        />

        <section className="bg-white py-20 sm:py-24">
          <div className="section-shell grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <Motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55 }}
              className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[2rem] bg-navy-950 p-8 shadow-[0_30px_80px_-45px_rgba(7,21,47,0.75)]"
            >
              <div className="subtle-grid absolute inset-0 opacity-10" />
              <div className="absolute -right-20 -top-20 size-64 rounded-full bg-brand-600/30 blur-3xl" />
              <div className="relative flex h-full flex-col items-center justify-center text-center">
                <span className="size-32 overflow-hidden rounded-3xl border border-white/15 shadow-2xl">
                  <img
                    src="/images/nwssu-cpe-logo.png"
                    alt={`${organizationProfile.name} logo`}
                    width="128"
                    height="128"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </span>
                <p className="mt-7 text-xs font-extrabold tracking-[0.22em] text-blue-300 uppercase">
                  NwSSU
                </p>
                <p className="mt-2 max-w-xs text-2xl font-black tracking-tight text-white">
                  {organizationProfile.name.replace(/^NwSSU\s*/i, '').trim() ||
                    organizationProfile.name}
                </p>
              </div>
            </Motion.div>

            <Motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55 }}
            >
              <p className="text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
                Organization overview
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                A community for Computer Engineering students
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                {organizationProfile.overview}
              </p>
              <div className="mt-8 rounded-2xl border border-blue-100 bg-brand-50/55 p-5">
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-blue-100">
                    <GraduationCap size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-navy-900">
                      Student-centered portal
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      This website brings organization updates, academic
                      resources, events, alumni records, and media archives
                      into one accessible place.
                    </p>
                  </div>
                </div>
              </div>
            </Motion.div>
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
                Areas of involvement
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                Supporting the student journey
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                The portal is organized around the academic, technical,
                community, and professional needs of students.
              </p>
            </Motion.div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {involvementAreas.map(
                ({ icon: Icon, title, description }, index) => (
                  <Motion.article
                    key={title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.5, delay: index * 0.06 }}
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
          </div>
        </section>

        <section className="bg-navy-950 py-20 text-white sm:py-24">
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <p className="text-xs font-extrabold tracking-[0.2em] text-blue-300 uppercase">
                Official direction
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Mission & Vision
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Approved statements will be published exactly as provided by
                the organization.
              </p>
            </Motion.div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {populatedOfficialRecords.map(
                ({ icon: Icon, title, value, emptyMessage }, index) => (
                  <Motion.article
                    key={title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className="rounded-3xl border border-white/10 bg-white/[0.07] p-7 backdrop-blur-sm sm:p-8"
                  >
                    <span className="grid size-12 place-items-center rounded-xl bg-white/10 text-blue-200">
                      <Icon size={23} aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-2xl font-black">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {value || emptyMessage}
                    </p>
                    {!value && (
                      <p className="mt-5 text-xs font-extrabold tracking-[0.16em] text-blue-300 uppercase">
                        Awaiting verified statement
                      </p>
                    )}
                  </Motion.article>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="section-shell grid gap-8 lg:grid-cols-2">
            <Motion.article
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.38)] sm:p-9"
            >
              <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <History size={25} aria-hidden="true" />
              </span>
              <p className="mt-6 text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
                Organization record
              </p>
              <h2 className="mt-2 text-3xl font-black text-navy-900">
                History
              </h2>
              {historyMilestones.length === 0 ? (
                <>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    The organization's founding date, previous administrations,
                    milestones, and major achievements have not been added yet.
                  </p>
                  <p className="mt-5 text-xs font-extrabold tracking-[0.16em] text-slate-400 uppercase">
                    Historical records being collected
                  </p>
                </>
              ) : (
                <div className="mt-6 space-y-5">
                  {historyMilestones.map((milestone) => (
                    <div
                      key={`${milestone.year}-${milestone.title}`}
                      className="border-l-2 border-blue-200 pl-5"
                    >
                      <p className="text-xs font-extrabold text-brand-600">
                        {milestone.year}
                      </p>
                      <h3 className="mt-1 font-extrabold text-navy-900">
                        {milestone.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {milestone.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Motion.article>

            <Motion.article
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.38)] sm:p-9"
            >
              <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <BriefcaseBusiness size={25} aria-hidden="true" />
              </span>
              <p className="mt-6 text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
                Current administration
              </p>
              <h2 className="mt-2 text-3xl font-black text-navy-900">
                Officers & Faculty
              </h2>
              {organizationOfficers.length === 0 ? (
                <>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    No verified officer or faculty directory has been
                    provided for the current academic year.
                  </p>
                  <p className="mt-5 text-xs font-extrabold tracking-[0.16em] text-slate-400 uppercase">
                    Leadership records awaiting confirmation
                  </p>
                </>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {organizationOfficers.map((officer) => (
                    <div
                      key={`${officer.position}-${officer.name}`}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <div className="flex items-start gap-4">
                        {officer.photo ? (
                          <img
                            src={officer.photo}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="profile-image size-16 rounded-2xl object-cover"
                          />
                        ) : (
                          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-lg font-black text-brand-600 ring-1 ring-blue-100">
                            {officer.initials}
                          </span>
                        )}
                        <div className="min-w-0">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold text-slate-500 uppercase">
                            {officer.person_type === 'faculty'
                              ? 'Faculty'
                              : 'Officer'}
                          </span>
                          <p className="mt-3 font-extrabold text-navy-900">
                            {officer.name}
                          </p>
                          <p className="mt-1 text-sm font-bold text-brand-600">
                            {officer.position}
                          </p>
                          {officer.academic_year && (
                            <p className="mt-1 text-xs font-bold text-slate-500">
                              {officer.academic_year}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Motion.article>
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
                Join the community
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                Membership
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Official membership guidelines will be posted after they are
                confirmed by the organization.
              </p>
            </Motion.div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {populatedMembershipItems.map(
                ({ icon: Icon, title, value, emptyMessage }, index) => (
                  <Motion.article
                    key={title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.5, delay: index * 0.07 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-lg font-extrabold text-navy-900">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {value || emptyMessage}
                    </p>
                  </Motion.article>
                ),
              )}
            </div>
          </div>
        </section>

        <section id="contact" className="bg-white py-20 sm:py-24">
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5 }}
              className="relative isolate overflow-hidden rounded-3xl bg-navy-950 px-6 py-12 text-white shadow-[0_30px_80px_-44px_rgba(7,21,47,0.8)] sm:px-10 lg:px-14"
            >
              <div className="subtle-grid absolute inset-0 -z-20 opacity-10" />
              <div className="absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-brand-600/25 blur-3xl" />

              <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.2em] text-blue-300 uppercase">
                    Official channels
                  </p>
                  <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                    Contact the Organization
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                    Use the verified organization channels below for
                    inquiries, coordination, and campus visits.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5">
                    <MapPin
                      size={23}
                      className="text-blue-200"
                      aria-hidden="true"
                    />
                    <h3 className="mt-4 font-extrabold">Campus</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {organizationProfile.campusAddress ||
                        'Northwest Samar State University, Calbayog City, Samar'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5">
                    <Mail
                      size={23}
                      className="text-blue-200"
                      aria-hidden="true"
                    />
                    <h3 className="mt-4 font-extrabold">Direct contact</h3>
                    <div className="mt-2 grid gap-1 text-sm leading-6 text-slate-300">
                      {organizationProfile.contactEmail && (
                        <a
                          href={`mailto:${organizationProfile.contactEmail}`}
                          className="transition hover:text-white"
                        >
                          {organizationProfile.contactEmail}
                        </a>
                      )}
                      {organizationProfile.contactPhone && (
                        <a
                          href={`tel:${organizationProfile.contactPhone}`}
                          className="transition hover:text-white"
                        >
                          {organizationProfile.contactPhone}
                        </a>
                      )}
                      {organizationProfile.facebookUrl && (
                        <a
                          href={organizationProfile.facebookUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 transition hover:text-white"
                        >
                          Facebook page
                          <ExternalLink size={13} aria-hidden="true" />
                        </a>
                      )}
                      {organizationProfile.officeHours && (
                        <span>{organizationProfile.officeHours}</span>
                      )}
                      {!organizationProfile.contactEmail &&
                        !organizationProfile.contactPhone &&
                        !organizationProfile.facebookUrl &&
                        !organizationProfile.officeHours && (
                          <span>
                            Official contact details will be posted once
                            confirmed.
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </Motion.div>
          </div>
        </section>
      </main>
    </>
  )
}

export default About
