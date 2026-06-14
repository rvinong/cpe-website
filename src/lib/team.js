import { supabase } from './supabase'

export const staffAvatarBucket = 'staff-avatars'
export const maxStaffAvatarSize = 5 * 1024 * 1024

const acceptedAvatarTypes = ['image/jpeg', 'image/png', 'image/webp']

export function isTeamSchemaMissing(error) {
  return ['42P01', '42703', '42883', 'PGRST202', 'PGRST204', '404'].includes(
    error?.code,
  )
}

export function getTeamMembers() {
  return supabase.rpc('staff_list_team_members')
}

export function getTeamTasks() {
  return supabase.rpc('staff_list_team_tasks')
}

export function createTeamTask(values) {
  return supabase.rpc('admin_create_team_task', {
    task_title: values.title.trim(),
    task_description: values.description.trim(),
    task_assigned_to: values.assignedTo,
    task_priority: values.priority,
    task_due_date: values.dueDate || null,
  })
}

export function updateTeamTask(id, values) {
  return supabase.rpc('admin_update_team_task', {
    target_id: id,
    task_title: values.title.trim(),
    task_description: values.description.trim(),
    task_assigned_to: values.assignedTo,
    task_status: values.status,
    task_priority: values.priority,
    task_due_date: values.dueDate || null,
  })
}

export function updateTeamTaskStatus(id, status) {
  return supabase.rpc('staff_update_team_task_status', {
    target_id: id,
    next_status: status,
  })
}

export function deleteTeamTask(id) {
  return supabase.rpc('admin_delete_team_task', { target_id: id })
}

export function setStaffAvatarPath(path) {
  return supabase.rpc('staff_set_avatar_path', {
    target_avatar_path: path || null,
  })
}

export function validateStaffAvatar(file) {
  if (!file) return ''
  if (!acceptedAvatarTypes.includes(file.type)) {
    return 'Use a JPG, PNG, or WebP image.'
  }
  if (file.size > maxStaffAvatarSize) {
    return 'Profile photos must be 5 MB or smaller.'
  }
  return ''
}

function sanitizeFilename(filename) {
  const extension = filename.split('.').pop()?.toLowerCase() || 'jpg'
  const base = filename
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

  return `${base || 'avatar'}.${extension}`
}

export async function uploadStaffAvatar(file, userId) {
  const fileError = validateStaffAvatar(file)
  if (fileError) return { data: null, error: new Error(fileError) }

  const path = `${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizeFilename(file.name)}`
  return supabase.storage.from(staffAvatarBucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
}

export function removeStaffAvatar(path) {
  if (!path) return { data: null, error: null }
  return supabase.storage.from(staffAvatarBucket).remove([path])
}

export async function getStaffAvatarUrl(path) {
  if (!path) return { data: null, error: null }

  const { data, error } = await supabase.storage
    .from(staffAvatarBucket)
    .createSignedUrl(path, 60 * 60)

  return { data: data?.signedUrl || null, error }
}
