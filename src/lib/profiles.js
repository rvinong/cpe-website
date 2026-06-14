import { supabase } from './supabase'

export function isProfilesRpcMissing(error) {
  return ['42883', 'PGRST202', '404'].includes(error?.code)
}

export async function getAdminProfiles() {
  return supabase.rpc('admin_list_profiles')
}

export async function updateAdminProfile(id, values) {
  return supabase.rpc('admin_update_profile', {
    target_id: id,
    target_full_name: values.fullName.trim(),
    target_student_number: values.studentNumber.trim() || null,
    target_role: values.role,
    target_status: values.status,
  })
}
