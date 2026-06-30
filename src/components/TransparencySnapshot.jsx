import {
  ArrowRight,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublicAuditReports } from '../lib/internalAudit'
import AnimatedCounter from './AnimatedCounter'
import Reveal from './Reveal'

const snapshotItems = [
  {
    type: 'project_proposal',
    label: 'Approved Project Proposals',
    description: 'Proposals cleared for organization implementation.',
    icon: ClipboardCheck,
    accent: 'bg-violet-50 text-violet-600 ring-violet-100',
  },
  {
    type: 'resolution',
    label: 'Approved Resolutions',
    description: 'Official decisions and organization approvals.',
    icon: FileText,
    accent: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  },
  {
    type: 'activity',
    label: 'Activities',
    description: 'Approved activities and implementation records.',
    icon: CalendarCheck,
    accent: 'bg-amber-50 text-amber-600 ring-amber-100',
  },
]

function TransparencySnapshot() {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)

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

  const counts = useMemo(
    () =>
      reports.reduce((currentCounts, report) => {
        const type = report.type || report.reportType
        return {
          ...currentCounts,
          [type]: (currentCounts[type] || 0) + 1,
        }
      }, {}),
    [reports],
  )

  const totalTracked = snapshotItems.reduce(
    (total, item) => total + (counts[item.type] || 0),
    0,
  )

  return (
    <section className="bg-slate-50/70 py-16 sm:py-20">
      <div className="section-shell">
        <Reveal>
          <article className="surface-card relative isolate overflow-hidden p-6 sm:p-8 lg:grid lg:grid-cols-[0.82fr_1.18fr] lg:gap-8">
            <div className="subtle-grid absolute inset-0 -z-20 opacity-70" />
            <div className="absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-brand-500/10 blur-3xl" />
            <div className="absolute -bottom-24 left-1/4 -z-10 size-60 rounded-full bg-orange-400/10 blur-3xl" />

            <div className="flex h-full flex-col justify-between gap-8">
              <div>
                <span className="grid size-13 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-blue-100">
                  <ShieldCheck size={24} aria-hidden="true" />
                </span>
                <p className="mt-6 text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
                  Transparency Snapshot
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                  Approved records at a glance
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                  A quick view of approved proposals, resolutions, and
                  activities connected to the organization internal audit
                  archive.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link to="/internal-audit" className="primary-button">
                  View Internal Audit
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <p className="text-xs font-bold text-slate-500">
                  {isLoading
                    ? 'Checking approved records...'
                    : `${totalTracked} tracked public records`}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:mt-0">
              {snapshotItems.map((item, index) => {
                const Icon = item.icon
                const value = counts[item.type] || 0

                return (
                  <Reveal
                    key={item.type}
                    delay={0.08 + index * 0.06}
                    amount={0.2}
                  >
                    <Link
                      to="/internal-audit#reports"
                      className="interactive-card block h-full rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.52)]"
                    >
                      <span
                        className={`grid size-12 place-items-center rounded-2xl ring-1 ${item.accent}`}
                      >
                        <Icon size={22} aria-hidden="true" />
                      </span>
                      <span className="mt-6 block text-4xl font-black tracking-tight text-navy-900">
                        {isLoading ? (
                          '...'
                        ) : (
                          <AnimatedCounter value={value} />
                        )}
                      </span>
                      <span className="mt-2 block text-sm font-extrabold text-navy-900">
                        {item.label}
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-slate-500">
                        {item.description}
                      </span>
                    </Link>
                  </Reveal>
                )
              })}
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  )
}

export default TransparencySnapshot
