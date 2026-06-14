import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CirclePlus,
  Clock3,
  Edit3,
  ImageUp,
  ListChecks,
  LoaderCircle,
  Save,
  ShieldCheck,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useAuth from '../context/useAuth'
import {
  createTeamTask,
  deleteTeamTask,
  getTeamMembers,
  getTeamTasks,
  isTeamSchemaMissing,
  removeStaffAvatar,
  setStaffAvatarPath,
  updateTeamTask,
  updateTeamTaskStatus,
  uploadStaffAvatar,
  validateStaffAvatar,
} from '../lib/team'
import StaffAvatar from './StaffAvatar'

const emptyTaskForm = {
  title: '',
  description: '',
  assignedTo: '',
  status: 'todo',
  priority: 'normal',
  dueDate: '',
}

const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

const statusOptions = [
  ['todo', 'To do'],
  ['in_progress', 'In progress'],
  ['blocked', 'Blocked'],
  ['done', 'Done'],
]

const statusStyles = {
  todo: 'bg-slate-100 text-slate-600 ring-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 ring-blue-200',
  blocked: 'bg-red-50 text-red-700 ring-red-200',
  done: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

const priorityStyles = {
  low: 'text-slate-500',
  normal: 'text-blue-600',
  high: 'text-amber-600',
  urgent: 'text-red-600',
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'Asia/Manila',
})

function formatDueDate(value) {
  if (!value) return 'No due date'
  return dateFormatter.format(new Date(`${value}T00:00:00+08:00`))
}

function isOverdue(task) {
  if (!task.due_date || task.status === 'done') return false
  return new Date(`${task.due_date}T23:59:59+08:00`) < new Date()
}

function AdminTeam() {
  const { user, profile, refreshProfile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState('')
  const [isTaskEditorOpen, setIsTaskEditorOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [needsSchema, setNeedsSchema] = useState(false)

  const loadTeam = useCallback(async () => {
    setIsLoading(true)
    const [membersResult, tasksResult] = await Promise.all([
      getTeamMembers(),
      getTeamTasks(),
    ])
    const loadError = membersResult.error || tasksResult.error

    if (loadError) {
      setError(loadError.message)
      setNeedsSchema(isTeamSchemaMissing(loadError))
    } else {
      setMembers(membersResult.data || [])
      setTasks(tasksResult.data || [])
      setError('')
      setNeedsSchema(false)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true

    Promise.all([getTeamMembers(), getTeamTasks()]).then(
      ([membersResult, tasksResult]) => {
        if (!isMounted) return

        const loadError = membersResult.error || tasksResult.error
        if (loadError) {
          setError(loadError.message)
          setNeedsSchema(isTeamSchemaMissing(loadError))
        } else {
          setMembers(membersResult.data || [])
          setTasks(tasksResult.data || [])
          setError('')
          setNeedsSchema(false)
        }
        setIsLoading(false)
      },
    )

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(
    () => () => {
      if (avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
    },
    [avatarPreview],
  )

  const editors = useMemo(
    () => members.filter((member) => member.role === 'editor'),
    [members],
  )

  const currentMember = useMemo(
    () => members.find((member) => member.id === user?.id),
    [members, user?.id],
  )

  const counts = useMemo(
    () => ({
      editors: editors.length,
      open: tasks.filter((task) => task.status !== 'done').length,
      blocked: tasks.filter((task) => task.status === 'blocked').length,
      done: tasks.filter((task) => task.status === 'done').length,
    }),
    [editors.length, tasks],
  )

  const openTaskEditor = (task = null) => {
    const firstEditorId = editors[0]?.id || ''
    setEditingTask(task)
    setTaskForm(
      task
        ? {
            title: task.title,
            description: task.description,
            assignedTo: task.assigned_to,
            status: task.status,
            priority: task.priority,
            dueDate: task.due_date || '',
          }
        : { ...emptyTaskForm, assignedTo: firstEditorId },
    )
    setError('')
    setSuccess('')
    setIsTaskEditorOpen(true)
  }

  const closeTaskEditor = () => {
    if (isSaving) return
    setIsTaskEditorOpen(false)
    setEditingTask(null)
    setTaskForm(emptyTaskForm)
  }

  const updateTaskField = (event) => {
    const { name, value } = event.target
    setTaskForm((current) => ({ ...current, [name]: value }))
  }

  const handleTaskSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!taskForm.title.trim() || !taskForm.assignedTo) {
      setError('Task title and assigned editor are required.')
      return
    }

    setIsSaving(true)
    const result = editingTask
      ? await updateTeamTask(editingTask.id, taskForm)
      : await createTeamTask(taskForm)

    if (result.error) {
      setError(result.error.message)
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    closeTaskEditor()
    setSuccess(editingTask ? 'Task updated.' : 'Task assigned.')
    await loadTeam()
  }

  const handleStatusChange = async (task, status) => {
    setUpdatingTaskId(task.id)
    setError('')
    const { error: updateError } = await updateTeamTaskStatus(task.id, status)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess('Task status updated.')
      await loadTeam()
    }
    setUpdatingTaskId('')
  }

  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Delete the task "${task.title}"?`)) return

    const { error: deleteError } = await deleteTeamTask(task.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setSuccess('Task deleted.')
    await loadTeam()
  }

  const handleAvatarFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileError = validateStaffAvatar(file)
    if (fileError) {
      setError(fileError)
      event.target.value = ''
      return
    }

    if (avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setError('')
    setSuccess('')
  }

  const clearAvatarSelection = () => {
    if (avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarFile(null)
    setAvatarPreview('')
  }

  const handleAvatarSave = async () => {
    if (!avatarFile || !user?.id) return

    setIsUploadingAvatar(true)
    setError('')
    const { data, error: uploadError } = await uploadStaffAvatar(
      avatarFile,
      user.id,
    )

    if (uploadError) {
      setError(uploadError.message)
      setIsUploadingAvatar(false)
      return
    }

    const { error: profileUpdateError } = await setStaffAvatarPath(data.path)
    if (profileUpdateError) {
      await removeStaffAvatar(data.path)
      setError(profileUpdateError.message)
      setIsUploadingAvatar(false)
      return
    }

    if (currentMember?.avatar_path) {
      await removeStaffAvatar(currentMember.avatar_path)
    }

    clearAvatarSelection()
    await refreshProfile()
    await loadTeam()
    setSuccess('Profile photo updated.')
    setIsUploadingAvatar(false)
  }

  const handleAvatarRemove = async () => {
    if (!currentMember?.avatar_path) return
    if (!window.confirm('Remove your current profile photo?')) return

    setIsUploadingAvatar(true)
    const { error: profileUpdateError } = await setStaffAvatarPath(null)

    if (profileUpdateError) {
      setError(profileUpdateError.message)
      setIsUploadingAvatar(false)
      return
    }

    await removeStaffAvatar(currentMember.avatar_path)
    await refreshProfile()
    await loadTeam()
    setSuccess('Profile photo removed.')
    setIsUploadingAvatar(false)
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
            Staff workspace
          </p>
          <h2 className="mt-2 text-3xl font-black text-navy-900">
            Team Management
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Keep the content team familiar, organized, and clear on what needs
            attention next.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => openTaskEditor()}
            disabled={needsSchema || editors.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CirclePlus size={18} />
            Assign task
          </button>
        )}
      </div>

      {needsSchema && (
        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
          Run <code className="font-bold">supabase/team.sql</code> in the
          Supabase SQL Editor, then refresh this page.
        </div>
      )}

      {(error || success) && !needsSchema && !isTaskEditorOpen && (
        <div
          className={`mt-7 rounded-xl border px-4 py-3 text-sm font-bold ${
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
          role="status"
        >
          {error || success}
        </div>
      )}

      <section className="mt-7 grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Selected profile preview"
                className="size-28 rounded-3xl object-cover"
              />
            ) : (
              <StaffAvatar
                path={currentMember?.avatar_path || profile?.avatar_path}
                name={currentMember?.full_name || profile?.full_name}
                className="size-28 rounded-3xl"
                textClassName="text-2xl"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-extrabold text-brand-600 uppercase">
                  {profile?.role}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Your team profile
                </span>
              </div>
              <h3 className="mt-3 truncate text-2xl font-black text-navy-900">
                {currentMember?.full_name ||
                  profile?.full_name ||
                  'Staff member'}
              </h3>
              <p className="mt-1 truncate text-sm text-slate-500">
                {currentMember?.email || user?.email}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-100 bg-brand-50 px-4 py-2.5 text-xs font-extrabold text-brand-600">
                  <ImageUp size={16} />
                  Choose photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarFile}
                    className="sr-only"
                  />
                </label>
                {avatarFile && (
                  <>
                    <button
                      type="button"
                      onClick={handleAvatarSave}
                      disabled={isUploadingAvatar}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-60"
                    >
                      {isUploadingAvatar ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      Save photo
                    </button>
                    <button
                      type="button"
                      onClick={clearAvatarSelection}
                      disabled={isUploadingAvatar}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-600"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {!avatarFile && currentMember?.avatar_path && (
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    disabled={isUploadingAvatar}
                    className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-extrabold text-red-600 disabled:opacity-60"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-400">
                JPG, PNG, or WebP. Maximum file size is 5 MB.
              </p>
            </div>
          </div>
        </article>

        <section className="grid grid-cols-2 gap-4">
          {[
            ['Editors', counts.editors, UsersRound],
            ['Open tasks', counts.open, Clock3],
            ['Blocked', counts.blocked, AlertTriangle],
            ['Completed', counts.done, CheckCircle2],
          ].map(([label, value, Icon]) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon size={19} />
              </span>
              <p className="mt-4 text-2xl font-black text-navy-900">{value}</p>
              <p className="mt-1 text-[10px] font-extrabold tracking-wide text-slate-500 uppercase">
                {label}
              </p>
            </article>
          ))}
        </section>
      </section>

      <section className="mt-9">
        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
            Team directory
          </p>
          <h3 className="mt-2 text-2xl font-black text-navy-900">
            Know who is working with you
          </h3>
        </div>

        {isLoading ? (
          <div className="mt-5 grid min-h-48 place-items-center rounded-2xl border border-slate-200 bg-white">
            <LoaderCircle
              size={28}
              className="animate-spin text-brand-600"
              aria-label="Loading team"
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => {
              const openTasks = tasks.filter(
                (task) =>
                  task.assigned_to === member.id && task.status !== 'done',
              ).length

              return (
                <article
                  key={member.id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <StaffAvatar
                    path={member.avatar_path}
                    name={member.full_name}
                    className="size-16 rounded-2xl"
                    textClassName="text-base"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold tracking-wide text-brand-600 uppercase">
                        {member.role}
                      </span>
                      {member.id === user?.id && (
                        <span className="text-[10px] font-bold text-slate-400">
                          You
                        </span>
                      )}
                    </div>
                    <h4 className="mt-1 truncate font-black text-navy-900">
                      {member.full_name || 'Unnamed staff member'}
                    </h4>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {member.email}
                    </p>
                    {(isAdmin || member.id === user?.id) && (
                      <p className="mt-2 text-xs font-bold text-slate-400">
                        {openTasks} open {openTasks === 1 ? 'task' : 'tasks'}
                      </p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
              Task queue
            </p>
            <h3 className="mt-2 text-2xl font-black text-navy-900">
              {isAdmin ? 'Assigned work' : 'Your assigned work'}
            </h3>
          </div>
          {!isAdmin && (
            <p className="max-w-md text-sm leading-6 text-slate-500">
              Update each task as you begin, encounter a blocker, or finish the
              work.
            </p>
          )}
        </div>

        {!isLoading && tasks.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-brand-50/35 px-6 py-14 text-center">
            <ListChecks size={32} className="mx-auto text-brand-600" />
            <h4 className="mt-4 text-lg font-black text-navy-900">
              No team tasks yet
            </h4>
            <p className="mt-2 text-sm text-slate-500">
              {isAdmin
                ? 'Assign the first task when an editor is ready.'
                : 'Your assigned tasks will appear here.'}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {tasks.map((task) => (
              <article
                key={task.id}
                className={`rounded-2xl border bg-white p-5 sm:p-6 ${
                  isOverdue(task) ? 'border-red-200' : 'border-slate-200'
                }`}
              >
                <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ring-1 ring-inset ${
                          statusStyles[task.status]
                        }`}
                      >
                        {
                          statusOptions.find(
                            ([value]) => value === task.status,
                          )?.[1]
                        }
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase ${
                          priorityStyles[task.priority]
                        }`}
                      >
                        {task.priority} priority
                      </span>
                      {isOverdue(task) && (
                        <span className="text-[10px] font-extrabold text-red-600 uppercase">
                          Overdue
                        </span>
                      )}
                    </div>
                    <h4 className="mt-3 text-lg font-black text-navy-900">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5 font-bold">
                        <CalendarClock size={15} />
                        {formatDueDate(task.due_date)}
                      </span>
                      {isAdmin && (
                        <span className="inline-flex items-center gap-2">
                          <StaffAvatar
                            path={task.assignee_avatar_path}
                            name={task.assignee_name}
                            className="size-6 rounded-lg"
                            textClassName="text-[8px]"
                          />
                          {task.assignee_name || 'Assigned editor'}
                        </span>
                      )}
                      <span>
                        Assigned by {task.assigner_name || 'an administrator'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label>
                      <span className="sr-only">
                        Update {task.title} status
                      </span>
                      <select
                        value={task.status}
                        onChange={(event) =>
                          handleStatusChange(task, event.target.value)
                        }
                        disabled={updatingTaskId === task.id}
                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-600 outline-none focus:border-brand-500"
                      >
                        {statusOptions.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => openTaskEditor(task)}
                          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-extrabold text-slate-600"
                        >
                          <Edit3 size={15} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task)}
                          className="grid size-10 place-items-center rounded-lg border border-red-200 text-red-600"
                          aria-label={`Delete ${task.title}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isTaskEditorOpen && isAdmin && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-navy-950/70 p-4 backdrop-blur-sm sm:p-6">
          <div className="mx-auto my-8 max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                  Team assignment
                </p>
                <h3 className="mt-1 text-2xl font-black text-navy-900">
                  {editingTask ? 'Update task' : 'Assign a task'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeTaskEditor}
                className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500"
                aria-label="Close task editor"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleTaskSubmit} className="px-5 py-6 sm:px-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Task title
                  <input
                    name="title"
                    value={taskForm.title}
                    onChange={updateTaskField}
                    className={inputClassName}
                    placeholder="Prepare next announcement"
                    required
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                  Instructions
                  <textarea
                    name="description"
                    value={taskForm.description}
                    onChange={updateTaskField}
                    className={`${inputClassName} min-h-28 resize-y`}
                    placeholder="Add the details the editor needs to complete the work."
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900">
                  Assigned editor
                  <select
                    name="assignedTo"
                    value={taskForm.assignedTo}
                    onChange={updateTaskField}
                    className={inputClassName}
                    required
                  >
                    <option value="">Select an editor</option>
                    {editors.map((editor) => (
                      <option key={editor.id} value={editor.id}>
                        {editor.full_name || editor.email}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-extrabold text-navy-900">
                  Due date
                  <input
                    type="date"
                    name="dueDate"
                    value={taskForm.dueDate}
                    onChange={updateTaskField}
                    className={inputClassName}
                  />
                </label>
                <label className="text-sm font-extrabold text-navy-900">
                  Priority
                  <select
                    name="priority"
                    value={taskForm.priority}
                    onChange={updateTaskField}
                    className={inputClassName}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>
                {editingTask && (
                  <label className="text-sm font-extrabold text-navy-900">
                    Status
                    <select
                      name="status"
                      value={taskForm.status}
                      onChange={updateTaskField}
                      className={inputClassName}
                    >
                      {statusOptions.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {editors.length === 0 && (
                <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                  Approve an editor account in Users & Roles before assigning
                  tasks.
                </p>
              )}

              {error && (
                <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={closeTaskEditor}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-extrabold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || editors.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
                >
                  {isSaving ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : editingTask ? (
                    <Save size={17} />
                  ) : (
                    <ShieldCheck size={17} />
                  )}
                  {isSaving
                    ? 'Saving...'
                    : editingTask
                      ? 'Save task'
                      : 'Assign task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTeam
