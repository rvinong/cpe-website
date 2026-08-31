import { isSupabaseConfigured, supabase } from './supabase'

export function isProfilesRpcMissing(error) {
  return ['42883', 'PGRST202', '404'].includes(error?.code)
}

export function normalizePublicMemberPreview(row) {
  return {
    profileId: row?.profile_id || row?.id || '',
    fullName:
      row?.display_name || row?.full_name || row?.fullName || 'Member',
    avatarPath: row?.avatar_path || row?.avatarPath || '',
    role: row?.role || 'student',
  }
}

export async function getPublicMemberPreview() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], total: 0, error: null }
  }

  const { data, error } = await supabase.rpc('get_public_member_preview')
  const members = error
    ? []
    : (data || []).map(normalizePublicMemberPreview)
  const rawTotal = data?.length ? Number(data[0].total_members) : 0

  return {
    data: members,
    total: Number.isFinite(rawTotal) ? rawTotal : 0,
    error,
  }
}

export async function getAdminProfiles() {
  return supabase.rpc('admin_list_profiles')
}

export async function updateAdminProfile(id, values) {
  return supabase.rpc('admin_update_profile', {
    target_id: id,
    target_full_name: values.fullName.trim(),
    target_student_number: values.studentNumber.trim() || null,
    target_year_level: values.yearLevel || '',
    target_role: values.role,
    target_status: values.status,
  })
}

export async function deleteAdminUser(id) {
  if (!supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured.'),
    }
  }

  const { data, error } = await supabase.functions.invoke('admin-delete-user', {
    body: { userId: id },
  })

  if (error) {
    const response = error.context
    if (response && typeof response.json === 'function') {
      try {
        const payload = await response.json()
        if (payload?.error) {
          return { data: null, error: new Error(payload.error) }
        }
      } catch {
        // Fall back to the SDK error when the response has no readable body.
      }
    }

    return { data: null, error }
  }
  if (data?.error) return { data: null, error: new Error(data.error) }

  return { data, error: null }
}
