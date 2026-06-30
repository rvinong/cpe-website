import { motion as Motion } from 'framer-motion'
import {
  Archive,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  LockKeyhole,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ContentSkeleton from '../components/ContentSkeleton'
import PageHero from '../components/PageHero'
import {
  internalAuditCategories,
  internalAuditProcess,
} from '../data/internalAudit'
import {
  createAuditReportDownload,
  getPublicAuditReports,
} from '../lib/internalAudit'

const categoryIcons = {
  accomplishment: FileCheck2,
  liquidation: ReceiptText,
  resolution: FileText,
}

const categoryStyles = {
  accomplishment: {
    icon: 'bg-brand-50 text-brand-600 ring-blue-100',
    badge: 'bg-brand-50 text-brand-700 ring-blue-100',
  },
  liquidation: {
    icon: 'bg-orange-50 text-orange-500 ring-orange-100',
    badge: 'bg-orange-50 text-orange-600 ring-orange-100',
  },
  resolution: {
    icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  },
}

function getCategory(documentType) {
  return internalAuditCategories.find((category) => category.id === documentType)
}

function InternalAudit() {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [downloadError, setDownloadError] = useState('')

  useEffect(() => {
    let isMounted = true

    getPublicAuditReports().then(({ data }) => {
      if (!isMounted) return
      setReports(data || [])
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const featuredReport =
    reports.find((report) => report.isFeatured) || reports[0] || null
  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return reports.filter((report) => {
      const category = getCategory(report.type)
      const matchesCategory =
        selectedCategory === 'All' || report.type === selectedCategory
      const matchesSearch =
        !normalizedSearch ||
        [
          report.title,
          report.period,
          report.summary,
          report.preparedBy,
          report.reviewedBy,
          category?.label,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [reports, searchTerm, selectedCategory])

  const openReportFile = async (report) => {
    setDownloadError('')

    const reportWindow = window.open('about:blank', '_blank')
    if (reportWindow) reportWindow.opener = null

    const { data, error } = await createAuditReportDownload(report)
    if (error) {
      reportWindow?.close()
      setDownloadError(error.message)
      return
    }

    if (reportWindow) {
      reportWindow.location.replace(data.signedUrl)
    } else {
      window.location.assign(data.signedUrl)
    }
  }

  const summaryCards = [
    {
      label: 'Document groups',
      value: internalAuditCategories.length,
      description: 'Main transparency record types',
      icon: Archive,
    },
    {
      label: 'Published records',
      value: isLoading ? '...' : reports.length,
      description: 'Visible approved archive entries',
      icon: ClipboardCheck,
    },
    {
      label: 'Review flow',
      value: internalAuditProcess.length,
      description: 'Steps before publication',
      icon: ShieldCheck,
    },
    {
      label: 'Access rule',
      value: 'Approved',
      description: 'Only verified reports should go public',
      icon: BadgeCheck,
    },
  ]

  return (
    <main className="pt-[84px]">
      <PageHero
        eyebrow="Organization accountability"
        title="Organizational Internal Audit"
        description="Access accomplishment reports, liquidation reports, resolutions, and approved transparency records from the organization."
        icon={ShieldCheck}
        accentIcon={ClipboardCheck}
        actions={
          <>
            <a href="#reports" className="primary-button">
              <Archive size={18} aria-hidden="true" />
              Browse reports
            </a>
            <a href="#process" className="secondary-button">
              <CheckCircle2 size={18} aria-hidden="true" />
              Audit process
            </a>
          </>
        }
      />

      <section className="bg-white py-16 sm:py-20">
        <div className="section-shell">
          <Motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5 }}
            className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
          >
            {summaryCards.map(({ label, value, description, icon: Icon }) => (
              <article key={label} className="surface-card p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="text-3xl font-black text-navy-900">
                    {value}
                  </span>
                </div>
                <p className="mt-4 text-xs font-extrabold tracking-wide text-slate-500 uppercase">
                  {label}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </article>
            ))}
          </Motion.div>
        </div>
      </section>

      <section className="bg-slate-50/70 py-20 sm:py-24">
        <div className="section-shell">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
            <Motion.article
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55 }}
              className="relative isolate overflow-hidden rounded-[2rem] bg-navy-950 p-7 text-white shadow-[0_30px_80px_-44px_rgba(7,21,47,0.8)] sm:p-9"
            >
              <div className="subtle-grid absolute inset-0 -z-20 opacity-10" />
              <div className="absolute -right-24 -top-24 -z-10 size-72 rounded-full bg-brand-600/25 blur-3xl" />
              <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-blue-200">
                <Sparkles size={25} aria-hidden="true" />
              </span>
              <p className="mt-7 text-xs font-extrabold tracking-[0.2em] text-blue-300 uppercase">
                Latest transparency file
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                {featuredReport?.title || 'No published report yet'}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {featuredReport?.summary ||
                  'Published audit records will appear here after admins or editors upload and approve the first transparency file.'}
              </p>

              <div className="mt-7 grid gap-3 text-sm">
                <span className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                  <CalendarDays
                    size={17}
                    className="text-blue-200"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="block text-white">
                      {featuredReport?.period || 'Awaiting first record'}
                    </strong>
                    <span className="text-slate-400">
                      {featuredReport?.publishedAt || 'Not published yet'}
                    </span>
                  </span>
                </span>
                <span className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                  <ShieldCheck
                    size={17}
                    className="text-blue-200"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="block text-white">
                      Reviewed by {featuredReport?.reviewedBy || 'TBA'}
                    </strong>
                    <span className="text-slate-400">
                      Prepared by {featuredReport?.preparedBy || 'TBA'}
                    </span>
                  </span>
                </span>
              </div>

              {featuredReport?.filePath ? (
                <button
                  type="button"
                  onClick={() => openReportFile(featuredReport)}
                  className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-navy-900 transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  <Download size={17} aria-hidden="true" />
                  View latest PDF
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-5 py-3 text-sm font-extrabold text-slate-300 opacity-75"
                >
                  <Download size={17} aria-hidden="true" />
                  PDF upload pending
                </button>
              )}
            </Motion.article>

            <Motion.div
              initial={{ opacity: 0, x: 18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="grid gap-5"
            >
              {internalAuditCategories.map((category, index) => {
                const Icon = categoryIcons[category.id]
                const count = reports.filter(
                  (report) => report.type === category.id,
                ).length

                return (
                  <Motion.article
                    key={category.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.5, delay: index * 0.06 }}
                    className="surface-card interactive-card p-6"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-4">
                        <span
                          className={`grid size-13 shrink-0 place-items-center rounded-2xl ring-1 ring-inset ${
                            categoryStyles[category.id].icon
                          }`}
                        >
                          <Icon size={24} aria-hidden="true" />
                        </span>
                        <div>
                          <h3 className="text-xl font-black text-navy-900">
                            {category.label}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-600">
                        {isLoading ? '...' : count}{' '}
                        {count === 1 ? 'record' : 'records'}
                      </span>
                    </div>
                  </Motion.article>
                )
              })}
            </Motion.div>
          </div>
        </div>
      </section>

      <section id="reports" className="scroll-mt-22 bg-white py-20 sm:py-24">
        <div className="section-shell">
          <Motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <p className="text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
              Public document archive
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
              Reports and Records
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Use this archive for published accomplishment reports,
              liquidation reports, and resolutions. Only approved public
              records appear in this archive.
            </p>
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.18 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="filter-panel mt-9"
          >
            <label className="relative block" htmlFor="audit-search">
              <span className="sr-only">Search internal audit records</span>
              <Search
                size={20}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="audit-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search reports, periods, or reviewers..."
                className="field-control pl-12 pr-4 placeholder:text-slate-400"
              />
            </label>

            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                aria-pressed={selectedCategory === 'All'}
                className={`filter-chip ${
                  selectedCategory === 'All' ? 'filter-chip-active' : ''
                }`}
              >
                All
              </button>
              {internalAuditCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  aria-pressed={selectedCategory === category.id}
                  className={`filter-chip ${
                    selectedCategory === category.id
                      ? 'filter-chip-active'
                      : ''
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </Motion.div>

          {downloadError && (
            <p className="mt-7 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {downloadError}
            </p>
          )}

          {isLoading ? (
            <ContentSkeleton
              count={4}
              columns={2}
              className="mt-10"
              label="Loading internal audit records"
            />
          ) : filteredReports.length === 0 ? (
            <div className="empty-state mt-10">
              <span className="empty-state-icon">
                <Archive size={26} aria-hidden="true" />
              </span>
              <h3 className="empty-state-title">No reports found</h3>
              <p className="empty-state-description">
                Published accomplishment reports, liquidation reports, and
                resolutions will appear here after they are approved.
              </p>
            </div>
          ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {filteredReports.map((report, index) => {
              const category = getCategory(report.type)
              const Icon = categoryIcons[report.type]

              return (
                <Motion.article
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  viewport={{ once: true, amount: 0.18 }}
                  transition={{ duration: 0.5, delay: (index % 2) * 0.05 }}
                  className="surface-card interactive-card flex h-full flex-col p-6 sm:p-7"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ring-1 ring-inset ${
                        categoryStyles[report.type].badge
                      }`}
                    >
                      <Icon size={15} aria-hidden="true" />
                      {category?.label}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-500">
                      {report.status}
                    </span>
                  </div>

                  <h3 className="mt-5 text-2xl font-black tracking-tight text-navy-900">
                    {report.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {report.summary}
                  </p>

                  <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                      <p className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                        Period
                      </p>
                      <p className="mt-1 font-bold text-navy-900">
                        {report.period}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                      <p className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                        Published
                      </p>
                      <p className="mt-1 font-bold text-navy-900">
                        {report.publishedAt}
                      </p>
                    </div>
                    {report.type === 'liquidation' && (
                      <>
                        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                          <p className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                            Funds received
                          </p>
                          <p className="mt-1 font-bold text-navy-900">
                            {report.fundsReceived}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                          <p className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                            Balance
                          </p>
                          <p className="mt-1 font-bold text-navy-900">
                            {report.remainingBalance}
                          </p>
                        </div>
                      </>
                    )}
                    {report.resolutionNumber && (
                      <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 sm:col-span-2">
                        <p className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                          Resolution number
                        </p>
                        <p className="mt-1 font-bold text-navy-900">
                          {report.resolutionNumber}
                        </p>
                      </div>
                    )}
                  </div>

                  <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5">
                    {report.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex gap-2 text-sm leading-6 text-slate-600"
                      >
                        <CheckCircle2
                          size={16}
                          className="mt-1 shrink-0 text-brand-600"
                          aria-hidden="true"
                        />
                        {highlight}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-bold text-slate-500">
                      Prepared by {report.preparedBy} - reviewed by{' '}
                      {report.reviewedBy}
                    </p>
                    {report.filePath ? (
                      <button
                        type="button"
                        onClick={() => openReportFile(report)}
                        className="primary-button"
                      >
                        <Eye size={16} aria-hidden="true" />
                        View file
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-extrabold text-slate-400"
                      >
                        <Filter size={14} aria-hidden="true" />
                        Awaiting PDF
                      </button>
                    )}
                  </div>
                </Motion.article>
              )
            })}
          </div>
          )}
        </div>
      </section>

      <section
        id="process"
        className="scroll-mt-22 bg-navy-950 py-20 text-white sm:py-24"
      >
        <div className="section-shell">
          <Motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <p className="text-xs font-extrabold tracking-[0.2em] text-blue-300 uppercase">
              Verification flow
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              How Records Become Public
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Internal audit records should be organized, checked, verified,
              and approved before being shared with students.
            </p>
          </Motion.div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {internalAuditProcess.map((step, index) => (
              <Motion.article
                key={step.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.5, delay: index * 0.07 }}
                className="rounded-3xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-sm"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-blue-200">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-xl font-black">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {step.description}
                </p>
              </Motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="section-shell">
          <Motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5 }}
            className="relative isolate overflow-hidden rounded-3xl border border-blue-100 bg-brand-50/45 p-7 sm:p-9 lg:grid lg:grid-cols-[auto_1fr] lg:gap-6"
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-blue-100">
              <LockKeyhole size={25} aria-hidden="true" />
            </span>
            <div className="mt-5 lg:mt-0">
              <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
                Transparency notice
              </p>
              <h2 className="mt-2 text-2xl font-black text-navy-900">
                Publish approved records only
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
                Only approved transparency records should be uploaded here.
                Sensitive personal information, private account details,
                signatures, receipt reference numbers, and confidential
                documents may be omitted or redacted for privacy and security.
              </p>
            </div>
          </Motion.div>
        </div>
      </section>
    </main>
  )
}

export default InternalAudit
