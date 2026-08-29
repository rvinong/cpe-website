import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  ListChecks,
  LoaderCircle,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useMemo } from 'react'
import { emptyDashboardSignals } from '../hooks/useAdminDashboardSignals'
import { getEventTiming } from '../lib/events'

const statusLabels = {
  todo: 'To do',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
}

const taskStatusStyles = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-50 text-blue-700',
  blocked: 'bg-red-50 text-red-700',
  done: 'bg-emerald-50 text-emerald-700',
}

function getTimestamp(value) {
  if (!value) return 0
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function getPercent(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

function isOverdueTask(task) {
  if (!task.due_date || task.status === 'done') return false
  return new Date(`${task.due_date}T23:59:59+08:00`) < new Date()
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function getHealthLabel(score) {
  if (score >= 80) return 'Strong'
  if (score >= 60) return 'Healthy'
  if (score >= 40) return 'Needs focus'
  return 'Early setup'
}

function buildContentSections(signals) {
  return [
    {
      label: 'Announcements',
      section: 'announcements',
      items: signals.announcements,
    },
    { label: 'Events', section: 'events', items: signals.events },
    { label: 'Resources', section: 'resources', items: signals.resources },
    { label: 'News', section: 'media', items: signals.news },
    { label: 'Gallery', section: 'media', items: signals.gallery },
    { label: 'Alumni', section: 'alumni', items: signals.alumni },
    { label: 'Internal Audit', section: 'audit', items: signals.audit },
  ]
}

function buildInsight({ analytics, contentSections }) {
  const insights = []

  if (analytics.blockedTasks > 0) {
    insights.push({
      title: 'Unblock the team first',
      detail: `${analytics.blockedTasks} task ${
        analytics.blockedTasks === 1 ? 'is' : 'are'
      } blocked and may slow publishing work.`,
      section: 'team',
      tone: 'red',
    })
  }

  if (analytics.overdueTasks > 0) {
    insights.push({
      title: 'Clear past due work',
      detail: `${analytics.overdueTasks} task ${
        analytics.overdueTasks === 1 ? 'is' : 'are'
      } past the due date.`,
      section: 'team',
      tone: 'amber',
    })
  }

  if (analytics.draftContent > 0) {
    insights.push({
      title: 'Review draft content',
      detail: `${analytics.draftContent} content ${
        analytics.draftContent === 1 ? 'item is' : 'items are'
      } still waiting for publication decisions.`,
      section: 'announcements',
      tone: 'blue',
    })
  }

  if (analytics.upcomingEvents === 0) {
    insights.push({
      title: 'Add the next event beat',
      detail: 'No published upcoming events are currently visible.',
      section: 'events',
      tone: 'blue',
    })
  }

  if (analytics.recentPublished === 0 && analytics.totalContent > 0) {
    insights.push({
      title: 'Publishing pace is quiet',
      detail: 'No content has been published in the last 30 days.',
      section: 'announcements',
      tone: 'amber',
    })
  }

  const emptySection = contentSections.find((section) => section.total === 0)
  if (emptySection) {
    insights.push({
      title: `${emptySection.label} needs starter content`,
      detail: 'This module is ready but does not have database content yet.',
      section: emptySection.section,
      tone: 'blue',
    })
  }

  if (insights.length === 0) {
    insights.push({
      title: 'Dashboard health looks balanced',
      detail:
        'Published content, events, and team task signals are in good shape.',
      section: 'overview',
      tone: 'emerald',
    })
  }

  return insights.slice(0, 4)
}

function getInsightTone(tone) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    red: 'border-red-200 bg-red-50 text-red-900',
  }

  return tones[tone] || 'border-blue-200 bg-brand-50/45 text-navy-900'
}

function AdminAnalyticsPanel({
  dashboardSignals = emptyDashboardSignals,
  isLoading,
  onSelectSection,
  referenceTime = 0,
  role,
}) {
  const contentSections = useMemo(() => {
    return buildContentSections(dashboardSignals).map((section) => {
      const total = section.items.length
      const published = section.items.filter(
        (item) => item.status === 'published',
      ).length
      const drafts = section.items.filter((item) => item.status === 'draft')
        .length

      return {
        ...section,
        total,
        published,
        drafts,
        publishedPercent: getPercent(published, total),
      }
    })
  }, [dashboardSignals])

  const analytics = useMemo(() => {
    const contentItems = contentSections.flatMap((section) => section.items)
    const totalContent = contentItems.length
    const publishedContent = contentItems.filter(
      (item) => item.status === 'published',
    ).length
    const draftContent = contentItems.filter((item) => item.status === 'draft')
      .length
    const publishedRate = getPercent(publishedContent, totalContent)
    const recentThreshold = referenceTime - 1000 * 60 * 60 * 24 * 30
    const recentPublished = contentItems.filter(
      (item) =>
        item.status === 'published' &&
        getTimestamp(item.published_at || item.updated_at || item.created_at) >=
          recentThreshold,
    ).length
    const eventTiming = dashboardSignals.events.reduce(
      (counts, event) => {
        const timing = getEventTiming(event)
        return {
          ...counts,
          [timing]: counts[timing] + 1,
        }
      },
      { upcoming: 0, completed: 0, cancelled: 0 },
    )
    const taskCounts = dashboardSignals.tasks.reduce(
      (counts, task) => ({
        ...counts,
        [task.status]: counts[task.status] + 1,
      }),
      { todo: 0, in_progress: 0, blocked: 0, done: 0 },
    )
    const overdueTasks = dashboardSignals.tasks.filter(isOverdueTask).length
    const taskCompletion = getPercent(
      taskCounts.done,
      dashboardSignals.tasks.length,
    )
    const contentScore = totalContent ? publishedRate * 0.42 : 10
    const taskScore = dashboardSignals.tasks.length
      ? taskCompletion * 0.25
      : 15
    const eventScore = eventTiming.upcoming > 0 ? 15 : 7
    const freshnessScore = Math.min(18, recentPublished * 4)
    const penalties = Math.min(
      28,
      taskCounts.blocked * 5 + overdueTasks * 4 + Math.floor(draftContent / 2),
    )
    const healthScore = clampScore(
      contentScore + taskScore + eventScore + freshnessScore + 18 - penalties,
    )

    return {
      blockedTasks: taskCounts.blocked,
      draftContent,
      eventTiming,
      healthLabel: getHealthLabel(healthScore),
      healthScore,
      overdueTasks,
      publishedContent,
      publishedRate,
      recentPublished,
      taskCompletion,
      taskCounts,
      totalContent,
      upcomingEvents: eventTiming.upcoming,
    }
  }, [contentSections, dashboardSignals, referenceTime])

  const insights = useMemo(
    () => buildInsight({ analytics, contentSections }),
    [analytics, contentSections],
  )
  const eventPipeline = [
    ['Upcoming', analytics.eventTiming.upcoming, 'events'],
    ['Completed', analytics.eventTiming.completed, 'events'],
    ['Cancelled', analytics.eventTiming.cancelled, 'events'],
    [
      'Drafts',
      dashboardSignals.events.filter((event) => event.status === 'draft')
        .length,
      'waiting',
    ],
  ]
  const taskWorkload = Object.entries(analytics.taskCounts).map(
    ([status, count]) => ({
      count,
      label: statusLabels[status],
      percent: getPercent(count, dashboardSignals.tasks.length),
      status,
    }),
  )

  return (
    <section className="mt-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
            Dashboard analytics
          </p>
          <h2 className="mt-2 text-3xl font-black text-navy-900">
            Website performance snapshot
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            A quick read of publishing health, event readiness, and staff task
            flow.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-white px-4 py-2 text-xs font-extrabold text-slate-500 ring-1 ring-slate-200 sm:self-auto">
          <TrendingUp size={15} aria-hidden="true" />
          {role === 'admin' ? 'Team-wide view' : 'Editor workload view'}
        </span>
      </div>

      <div className="grid gap-3 xl:grid-cols-[0.82fr_1.18fr]">
        <article className="surface-card overflow-hidden p-0">
          <div className="relative isolate overflow-hidden bg-navy-950 p-5 text-white">
            <div className="subtle-grid absolute inset-0 -z-20 opacity-10" />
            <div className="absolute -right-16 -top-20 -z-10 size-56 rounded-full bg-brand-600/25 blur-3xl" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold tracking-[0.18em] text-blue-300 uppercase">
                  Health score
                </p>
                <div className="mt-3 flex items-end gap-3">
                  <span className="text-5xl font-black tracking-tight">
                    {isLoading ? '...' : analytics.healthScore}
                  </span>
                  <span className="pb-2 text-sm font-extrabold text-blue-200">
                    / 100
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {isLoading
                    ? 'Analyzing dashboard signals...'
                    : `${analytics.healthLabel} based on publishing, tasks, events, and freshness.`}
                </p>
              </div>
              <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-blue-200">
                <Gauge size={26} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-300 to-brand-500 transition-all duration-700"
                style={{ width: `${isLoading ? 0 : analytics.healthScore}%` }}
              />
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {[
              [
                'Published rate',
                `${analytics.publishedRate}%`,
                `${analytics.publishedContent}/${analytics.totalContent} content items`,
                CheckCircle2,
              ],
              [
                'Last 30 days',
                analytics.recentPublished,
                'new published items',
                Sparkles,
              ],
              [
                'Event pipeline',
                analytics.upcomingEvents,
                'upcoming published events',
                CalendarDays,
              ],
              [
                'Task completion',
                `${analytics.taskCompletion}%`,
                'done from visible tasks',
                ListChecks,
              ],
            ].map(([label, value, detail, Icon]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-300 bg-slate-50/70 p-3"
              >
                <Icon size={19} className="text-brand-600" aria-hidden="true" />
                <p className="mt-2 text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-black text-navy-900">
                  {isLoading ? '...' : value}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </article>

        <div className="grid gap-3">
          <article className="surface-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
                  Publishing mix
                </p>
                <h3 className="mt-2 text-2xl font-black text-navy-900">
                  Content by module
                </h3>
              </div>
              <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <BarChart3 size={21} aria-hidden="true" />
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-brand-50/45 p-5 text-sm font-extrabold text-brand-600">
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Building analytics...
                </div>
              ) : (
                contentSections.map(
                  ({
                    label,
                    section,
                    total,
                    published,
                    drafts,
                    publishedPercent,
                  }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => onSelectSection(section)}
                      className="group text-left"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-sm font-black text-navy-900 group-hover:text-brand-600">
                          {label}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {published}/{total} published
                        </span>
                      </span>
                      <span className="mt-2 block h-2 overflow-hidden rounded-full bg-slate-100">
                        <span
                          className="block h-full rounded-full bg-brand-600"
                          style={{ width: `${publishedPercent}%` }}
                        />
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {drafts} {drafts === 1 ? 'draft' : 'drafts'} waiting
                      </span>
                    </button>
                  ),
                )
              )}
            </div>
          </article>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="surface-card p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
                    Events
                  </p>
                  <h3 className="mt-2 text-xl font-black text-navy-900">
                    Pipeline status
                  </h3>
                </div>
                <CalendarDays size={23} className="text-brand-600" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {eventPipeline.map(([label, value, detail]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onSelectSection('events')}
                    className="rounded-2xl border border-slate-300 bg-slate-50/70 p-3 text-left transition hover:border-brand-300 hover:bg-white"
                  >
                    <p className="text-xs font-extrabold text-slate-400 uppercase">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-navy-900">
                      {isLoading ? '...' : value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{detail}</p>
                  </button>
                ))}
              </div>
            </article>

            <article className="surface-card p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
                    Team
                  </p>
                  <h3 className="mt-2 text-xl font-black text-navy-900">
                    Workload status
                  </h3>
                </div>
                <Clock3 size={23} className="text-brand-600" />
              </div>
              <div className="mt-4 grid gap-3">
                {taskWorkload.map(({ count, label, percent, status }) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onSelectSection('team')}
                    className="text-left"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${taskStatusStyles[status]}`}
                      >
                        {label}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {count}
                      </span>
                    </span>
                    <span className="mt-2 block h-2 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-brand-600"
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                  </button>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>

      <article className="surface-card mt-3 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
              Recommended moves
            </p>
            <h3 className="mt-2 text-2xl font-black text-navy-900">
              Analytics insights
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Updated from live dashboard records
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {isLoading ? (
            <div className="rounded-2xl bg-brand-50/45 p-4 text-sm font-extrabold text-brand-600 md:col-span-2">
              Reading analytics insights...
            </div>
          ) : (
            insights.map(({ title, detail, section, tone }) => (
              <button
                key={title}
                type="button"
                onClick={() => onSelectSection(section)}
                className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${getInsightTone(
                  tone,
                )}`}
              >
                <p className="text-sm font-black">{title}</p>
                <p className="mt-2 text-sm leading-6 opacity-80">{detail}</p>
              </button>
            ))
          )}
        </div>
      </article>
    </section>
  )
}

export default AdminAnalyticsPanel
