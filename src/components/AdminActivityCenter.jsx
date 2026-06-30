import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileArchive,
  GraduationCap,
  Images,
  ListChecks,
  LoaderCircle,
  Newspaper,
  Radio,
  Sparkles,
} from 'lucide-react'
import { useMemo } from 'react'
import { emptyDashboardSignals } from '../hooks/useAdminDashboardSignals'
import { getEventTiming } from '../lib/events'

const sourceLabels = {
  announcements: 'Announcements',
  events: 'Events',
  resources: 'Resources',
  news: 'News',
  gallery: 'Gallery',
  media: 'News & Gallery',
  alumni: 'Alumni',
  audit: 'Internal Audit',
  team: 'Team',
}

const sourceIcons = {
  announcements: Bell,
  events: CalendarDays,
  resources: FileArchive,
  media: Images,
  alumni: GraduationCap,
  audit: FileArchive,
  team: ListChecks,
}

const relativeFormatter = new Intl.RelativeTimeFormat('en-US', {
  numeric: 'auto',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila',
})

function getTimestamp(value) {
  if (!value) return 0
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function formatRelativeTime(value) {
  const timestamp = getTimestamp(value)
  if (!timestamp) return 'Recently'

  const diffInSeconds = Math.round((timestamp - Date.now()) / 1000)
  const units = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ]

  for (const [unit, seconds] of units) {
    if (Math.abs(diffInSeconds) >= seconds) {
      return relativeFormatter.format(
        Math.round(diffInSeconds / seconds),
        unit,
      )
    }
  }

  return 'Just now'
}

function formatDateTime(value) {
  const timestamp = getTimestamp(value)
  if (!timestamp) return 'No date'
  return dateTimeFormatter.format(new Date(timestamp))
}

function labelStatus(status) {
  return (status || 'updated').replace(/_/g, ' ')
}

function isOverdueTask(task) {
  if (!task.due_date || task.status === 'done') return false
  return new Date(`${task.due_date}T23:59:59+08:00`) < new Date()
}

function isDueSoon(task) {
  if (!task.due_date || task.status === 'done') return false

  const dueDate = new Date(`${task.due_date}T23:59:59+08:00`)
  const now = new Date()
  const weekFromNow = new Date(now)
  weekFromNow.setDate(now.getDate() + 7)

  return dueDate >= now && dueDate <= weekFromNow
}

function isUpcomingSoon(event) {
  if (event.status !== 'published') return false
  if (getEventTiming(event) !== 'upcoming') return false

  const startsAt = new Date(event.starts_at)
  const now = new Date()
  const weekFromNow = new Date(now)
  weekFromNow.setDate(now.getDate() + 7)

  return startsAt >= now && startsAt <= weekFromNow
}

function createActivity({
  id,
  title,
  detail,
  section,
  timestamp,
  eyebrow,
}) {
  const Icon = sourceIcons[section] || Radio

  return {
    id,
    title,
    detail,
    section,
    source: sourceLabels[section] || 'Dashboard',
    timestamp,
    timeAgo: formatRelativeTime(timestamp),
    exactTime: formatDateTime(timestamp),
    eyebrow,
    Icon,
  }
}

function buildActivities(data) {
  const activities = [
    ...data.announcements.map((item) =>
      createActivity({
        id: `announcement-${item.id}`,
        title: item.title,
        detail: `${labelStatus(item.status)} - ${item.category}`,
        section: 'announcements',
        timestamp: item.updated_at || item.published_at || item.created_at,
        eyebrow:
          item.status === 'published'
            ? 'Announcement published'
            : 'Announcement updated',
      }),
    ),
    ...data.events.map((item) =>
      createActivity({
        id: `event-${item.id}`,
        title: item.title,
        detail: `${labelStatus(item.status)} - ${formatDateTime(
          item.starts_at,
        )}`,
        section: 'events',
        timestamp: item.updated_at || item.published_at || item.created_at,
        eyebrow:
          getEventTiming(item) === 'upcoming'
            ? 'Event scheduled'
            : 'Event updated',
      }),
    ),
    ...data.resources.map((item) =>
      createActivity({
        id: `resource-${item.id}`,
        title: item.title,
        detail: `${labelStatus(item.status)} - ${item.category}`,
        section: 'resources',
        timestamp: item.updated_at || item.created_at,
        eyebrow: 'Resource updated',
      }),
    ),
    ...data.news.map((item) =>
      createActivity({
        id: `news-${item.id}`,
        title: item.title,
        detail: `${labelStatus(item.status)} - ${item.category}`,
        section: 'media',
        timestamp: item.updated_at || item.published_at || item.created_at,
        eyebrow: item.status === 'published' ? 'News published' : 'News updated',
      }),
    ),
    ...data.gallery.map((item) =>
      createActivity({
        id: `gallery-${item.id}`,
        title: item.album,
        detail: `${labelStatus(item.status)} - ${item.category}`,
        section: 'media',
        timestamp: item.updated_at || item.created_at,
        eyebrow: 'Gallery updated',
      }),
    ),
    ...data.alumni.map((item) =>
      createActivity({
        id: `alumni-${item.id}`,
        title: item.name,
        detail: `${labelStatus(item.status)} - Batch ${item.batch}`,
        section: 'alumni',
        timestamp: item.updated_at || item.published_at || item.created_at,
        eyebrow: 'Alumni profile updated',
      }),
    ),
    ...data.audit.map((item) =>
      createActivity({
        id: `audit-${item.id}`,
        title: item.title,
        detail: `${labelStatus(item.status)} - ${item.report_type}`,
        section: 'audit',
        timestamp: item.updated_at || item.published_at || item.created_at,
        eyebrow:
          item.status === 'published'
            ? 'Audit report published'
            : 'Audit report updated',
      }),
    ),
    ...data.tasks.map((task) =>
      createActivity({
        id: `task-${task.id}`,
        title: task.title,
        detail: `${labelStatus(task.status)} - ${
          task.assignee_name || 'Assigned editor'
        }`,
        section: 'team',
        timestamp: task.updated_at || task.created_at,
        eyebrow:
          task.status === 'done'
            ? 'Task completed'
            : task.status === 'blocked'
              ? 'Task blocked'
              : 'Task updated',
      }),
    ),
  ]

  return activities
    .filter((item) => getTimestamp(item.timestamp))
    .sort(
      (left, right) =>
        getTimestamp(right.timestamp) - getTimestamp(left.timestamp),
    )
    .slice(0, 7)
}

function createAttentionItem({
  id,
  title,
  detail,
  count,
  section,
  icon: Icon,
  tone = 'blue',
}) {
  return {
    id,
    title,
    detail,
    count,
    section,
    Icon,
    tone,
  }
}

function buildAttentionItems(data, role) {
  const blockedTasks = data.tasks.filter((task) => task.status === 'blocked')
  const overdueTasks = data.tasks.filter(isOverdueTask)
  const dueSoonTasks = data.tasks.filter(isDueSoon)
  const drafts = [
    ...data.announcements.filter((item) => item.status === 'draft'),
    ...data.events.filter((item) => item.status === 'draft'),
    ...data.resources.filter((item) => item.status === 'draft'),
    ...data.news.filter((item) => item.status === 'draft'),
    ...data.gallery.filter((item) => item.status === 'draft'),
    ...data.alumni.filter((item) => item.status === 'draft'),
    ...data.audit.filter((item) => item.status === 'draft'),
  ]
  const upcomingSoon = data.events.filter(isUpcomingSoon)
  const needsAttention = []
  const taskScope = role === 'admin' ? 'team' : 'assigned'

  if (blockedTasks.length > 0) {
    needsAttention.push(
      createAttentionItem({
        id: 'blocked-tasks',
        title: 'Blocked tasks',
        detail: `${blockedTasks.length} ${taskScope} ${
          blockedTasks.length === 1 ? 'task needs' : 'tasks need'
        } help or a decision.`,
        count: blockedTasks.length,
        section: 'team',
        icon: AlertTriangle,
        tone: 'red',
      }),
    )
  }

  if (overdueTasks.length > 0) {
    needsAttention.push(
      createAttentionItem({
        id: 'overdue-tasks',
        title: 'Past due tasks',
        detail: `${overdueTasks.length} ${taskScope} ${
          overdueTasks.length === 1 ? 'task is' : 'tasks are'
        } past the due date.`,
        count: overdueTasks.length,
        section: 'team',
        icon: Clock3,
        tone: 'amber',
      }),
    )
  }

  if (drafts.length > 0) {
    needsAttention.push(
      createAttentionItem({
        id: 'draft-content',
        title: 'Draft content',
        detail: `${drafts.length} ${
          drafts.length === 1 ? 'item is' : 'items are'
        } waiting for review or publication.`,
        count: drafts.length,
        section: 'announcements',
        icon: Newspaper,
      }),
    )
  }

  if (dueSoonTasks.length > 0) {
    needsAttention.push(
      createAttentionItem({
        id: 'due-soon',
        title: 'Due this week',
        detail: `${dueSoonTasks.length} ${taskScope} ${
          dueSoonTasks.length === 1 ? 'task is' : 'tasks are'
        } due within seven days.`,
        count: dueSoonTasks.length,
        section: 'team',
        icon: ListChecks,
      }),
    )
  }

  if (upcomingSoon.length > 0) {
    needsAttention.push(
      createAttentionItem({
        id: 'upcoming-events',
        title: 'Upcoming events',
        detail: `${upcomingSoon.length} published ${
          upcomingSoon.length === 1 ? 'event happens' : 'events happen'
        } within seven days.`,
        count: upcomingSoon.length,
        section: 'events',
        icon: CalendarDays,
        tone: 'emerald',
      }),
    )
  }

  return needsAttention.slice(0, 5)
}

function getToneClass(tone) {
  const tones = {
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
  }

  return tones[tone] || 'bg-brand-50 text-brand-700 ring-blue-200'
}

function AdminActivityCenter({
  dashboardSignals = emptyDashboardSignals,
  isLoading,
  onSelectSection,
  role,
  sourceError,
}) {
  const activityData = dashboardSignals

  const activities = useMemo(
    () => buildActivities(activityData),
    [activityData],
  )
  const attentionItems = useMemo(
    () => buildAttentionItems(activityData, role),
    [activityData, role],
  )
  const metrics = useMemo(() => {
    const openTasks = activityData.tasks.filter(
      (task) => task.status !== 'done',
    ).length
    const publishedContent = [
      ...activityData.announcements,
      ...activityData.events,
      ...activityData.resources,
      ...activityData.news,
      ...activityData.gallery,
      ...activityData.alumni,
      ...activityData.audit,
    ].filter((item) => item.status === 'published').length

    return [
      ['Attention', attentionItems.length, 'items to check'],
      [
        'Open tasks',
        openTasks,
        role === 'admin' ? 'team workload' : 'assigned to you',
      ],
      ['Recent changes', activities.length, 'latest updates'],
      ['Published', publishedContent, 'live content items'],
    ]
  }, [activityData, activities.length, attentionItems.length, role])

  return (
    <section className="mt-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, detail]) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.35)]"
          >
            <p className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
              {label}
            </p>
            <p className="mt-3 text-2xl font-black text-navy-900">
              {isLoading ? '...' : value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="surface-card overflow-hidden p-0">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
                  Smart queue
                </p>
                <h2 className="mt-2 text-2xl font-black text-navy-900">
                  Needs attention
                </h2>
              </div>
              <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <Sparkles size={22} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              A quick scan of tasks, drafts, and upcoming event pressure points.
            </p>
          </div>

          <div className="grid gap-3 p-5">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-brand-50/45 p-6 text-sm font-extrabold text-brand-600">
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                  aria-hidden="true"
                />
                Reading dashboard signals...
              </div>
            ) : attentionItems.length > 0 ? (
              attentionItems.map(
                ({ id, title, detail, count, section, Icon, tone }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectSection(section)}
                    className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-white"
                  >
                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-xl text-sm font-black ring-1 ${getToneClass(
                        tone,
                      )}`}
                    >
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-sm font-black text-navy-900">
                          {title}
                        </span>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-500 ring-1 ring-slate-200">
                          {count}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-slate-600">
                        {detail}
                      </span>
                    </span>
                  </button>
                ),
              )
            ) : (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="flex gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-600">
                    <CheckCircle2 size={19} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-emerald-900">
                      No urgent dashboard items
                    </p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800">
                      Tasks, drafts, and upcoming events look calm right now.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {sourceError && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                {sourceError}
              </p>
            )}
          </div>
        </article>

        <article className="surface-card overflow-hidden p-0">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
                  Activity center
                </p>
                <h2 className="mt-2 text-2xl font-black text-navy-900">
                  Recent dashboard activity
                </h2>
              </div>
              <span className="grid size-12 place-items-center rounded-2xl bg-navy-950 text-blue-200">
                <Radio size={22} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              A shared pulse of content updates and team task movement.
            </p>
          </div>

          <div className="grid gap-1 p-5">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-brand-50/45 p-6 text-sm font-extrabold text-brand-600">
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                  aria-hidden="true"
                />
                Loading recent activity...
              </div>
            ) : activities.length > 0 ? (
              activities.map(
                ({
                  id,
                  title,
                  detail,
                  section,
                  source,
                  timeAgo,
                  exactTime,
                  eyebrow,
                  Icon,
                }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectSection(section)}
                    className="group grid grid-cols-[auto_1fr_auto] gap-3 rounded-2xl p-3 text-left transition hover:bg-slate-50"
                  >
                    <span className="mt-1 grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="text-[11px] font-extrabold tracking-wide text-brand-600 uppercase">
                        {eyebrow}
                      </span>
                      <span className="mt-1 block truncate text-sm font-black text-navy-900">
                        {title}
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-500">
                        {source} - {detail}
                      </span>
                    </span>
                    <span className="mt-1 hidden text-right text-[11px] font-bold text-slate-400 sm:block">
                      <span className="block">{timeAgo}</span>
                      <span className="mt-1 block font-medium">{exactTime}</span>
                    </span>
                  </button>
                ),
              )
            ) : (
              <div className="rounded-2xl border border-dashed border-blue-200 bg-brand-50/35 p-6 text-center">
                <p className="text-sm font-black text-navy-900">
                  No recent activity yet
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Updates will appear here after content or task changes.
                </p>
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}

export default AdminActivityCenter
