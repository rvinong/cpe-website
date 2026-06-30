import {
  historyMilestones,
  membershipDetails,
  organizationOfficers,
  organizationProfile,
  organizationStats,
} from '../data/about'
import {
  mediaBucket,
  removeMedia,
  uploadMedia,
  validateMediaFile,
} from './media'
import { isSupabaseConfigured, supabase } from './supabase'

const profileColumns = [
  'id',
  'name',
  'overview',
  'mission',
  'vision',
  'footer_description',
  'glance_heading',
  'glance_description',
  'campus_address',
  'contact_email',
  'contact_phone',
  'office_hours',
  'facebook_url',
  'instagram_url',
  'youtube_url',
  'linkedin_url',
  'membership_eligibility',
  'membership_process',
  'membership_requirements',
  'years_value',
  'years_suffix',
  'events_value',
  'events_suffix',
  'members_value',
  'members_suffix',
  'curriculum_units_value',
  'curriculum_units_suffix',
  'partners_value',
  'partners_suffix',
  'updated_at',
].join(', ')

const officerColumns = [
  'id',
  'person_type',
  'name',
  'position',
  'academic_year',
  'photo_path',
  'sort_order',
  'created_at',
  'updated_at',
].join(', ')

const milestoneColumns = [
  'id',
  'year',
  'title',
  'description',
  'sort_order',
  'created_at',
  'updated_at',
].join(', ')

export const fallbackOrganization = {
  profile: organizationProfile,
  membership: membershipDetails,
  stats: organizationStats,
  officers: organizationOfficers.map(normalizeOrganizationPerson),
  milestones: historyMilestones,
}

export function getPersonInitials(name = '') {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return initials || 'CP'
}

export function getOrganizationPersonPhotoUrl(path) {
  if (!path || !supabase) return null
  return supabase.storage.from(mediaBucket).getPublicUrl(path).data.publicUrl
}

export function normalizeOrganizationPerson(row) {
  const personType =
    row.person_type ||
    (/adviser|advisor|faculty|professor|mentor/i.test(row.position || '')
      ? 'faculty'
      : 'officer')

  return {
    ...row,
    person_type: personType,
    personType,
    photo: getOrganizationPersonPhotoUrl(row.photo_path),
    initials: getPersonInitials(row.name),
  }
}

export function normalizeOrganizationProfile(row) {
  return {
    profile: {
      name: row.name,
      overview: row.overview,
      mission: row.mission,
      vision: row.vision,
      footerDescription: row.footer_description,
      glanceHeading: row.glance_heading,
      glanceDescription: row.glance_description,
      campusAddress: row.campus_address,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      officeHours: row.office_hours,
      facebookUrl: row.facebook_url,
      instagramUrl: row.instagram_url,
      youtubeUrl: row.youtube_url,
      linkedinUrl: row.linkedin_url,
    },
    membership: {
      eligibility: row.membership_eligibility,
      process: row.membership_process,
      requirements: row.membership_requirements,
    },
    stats: {
      years: { value: row.years_value, suffix: row.years_suffix },
      events: { value: row.events_value, suffix: row.events_suffix },
      members: { value: row.members_value, suffix: row.members_suffix },
      curriculumUnits: {
        value: row.curriculum_units_value,
        suffix: row.curriculum_units_suffix,
      },
      partners: { value: row.partners_value, suffix: row.partners_suffix },
    },
  }
}

export function isOrganizationSchemaMissing(error) {
  return ['42P01', '42703', 'PGRST204', 'PGRST205', '404'].includes(
    error?.code,
  )
}

export async function getOrganizationContent() {
  if (!isSupabaseConfigured) {
    return { data: fallbackOrganization, error: null }
  }

  const [profileResult, officerResult, milestoneResult] = await Promise.all([
    supabase
      .from('organization_profile')
      .select(profileColumns)
      .eq('id', 1)
      .maybeSingle(),
    supabase
      .from('organization_officers')
      .select(officerColumns)
      .order('sort_order', { ascending: true })
      .order('position', { ascending: true }),
    supabase
      .from('organization_milestones')
      .select(milestoneColumns)
      .order('sort_order', { ascending: true })
      .order('year', { ascending: true }),
  ])

  const error =
    profileResult.error || officerResult.error || milestoneResult.error
  if (error) return { data: fallbackOrganization, error }

  const normalized = profileResult.data
    ? normalizeOrganizationProfile(profileResult.data)
    : fallbackOrganization

  return {
    data: {
      ...normalized,
      officers: (officerResult.data || []).map(normalizeOrganizationPerson),
      milestones: milestoneResult.data,
    },
    error: null,
  }
}

function toProfilePayload(values) {
  return {
    id: 1,
    name: values.name.trim(),
    overview: values.overview.trim(),
    mission: values.mission.trim(),
    vision: values.vision.trim(),
    footer_description: values.footerDescription.trim(),
    glance_heading: values.glanceHeading.trim(),
    glance_description: values.glanceDescription.trim(),
    campus_address: values.campusAddress.trim(),
    contact_email: values.contactEmail.trim(),
    contact_phone: values.contactPhone.trim(),
    office_hours: values.officeHours.trim(),
    facebook_url: values.facebookUrl.trim(),
    instagram_url: values.instagramUrl.trim(),
    youtube_url: values.youtubeUrl.trim(),
    linkedin_url: values.linkedinUrl.trim(),
    membership_eligibility: values.membershipEligibility.trim(),
    membership_process: values.membershipProcess.trim(),
    membership_requirements: values.membershipRequirements.trim(),
    years_value: Number(values.yearsValue) || 0,
    years_suffix: values.yearsSuffix.trim(),
    events_value: Number(values.eventsValue) || 0,
    events_suffix: values.eventsSuffix.trim(),
    members_value: Number(values.membersValue) || 0,
    members_suffix: values.membersSuffix.trim(),
    curriculum_units_value: Number(values.curriculumUnitsValue) || 0,
    curriculum_units_suffix: values.curriculumUnitsSuffix.trim(),
    partners_value: Number(values.partnersValue) || 0,
    partners_suffix: values.partnersSuffix.trim(),
  }
}

export async function saveOrganizationProfile(values) {
  return supabase
    .from('organization_profile')
    .upsert(toProfilePayload(values), { onConflict: 'id' })
    .select(profileColumns)
    .single()
}

function toOfficerPayload(values, photoPath) {
  return {
    person_type: values.personType || 'officer',
    name: values.name.trim(),
    position: values.position.trim(),
    academic_year: values.academicYear.trim(),
    photo_path: photoPath,
    sort_order: Number(values.sortOrder) || 0,
  }
}

export async function createOfficer(values, photoPath) {
  return supabase
    .from('organization_officers')
    .insert(toOfficerPayload(values, photoPath))
    .select(officerColumns)
    .single()
}

export async function updateOfficer(id, values, photoPath) {
  return supabase
    .from('organization_officers')
    .update(toOfficerPayload(values, photoPath))
    .eq('id', id)
    .select(officerColumns)
    .single()
}

export async function deleteOfficer(id) {
  return supabase.from('organization_officers').delete().eq('id', id)
}

function toMilestonePayload(values) {
  return {
    year: values.year.trim(),
    title: values.title.trim(),
    description: values.description.trim(),
    sort_order: Number(values.sortOrder) || 0,
  }
}

export async function createMilestone(values) {
  return supabase
    .from('organization_milestones')
    .insert(toMilestonePayload(values))
    .select(milestoneColumns)
    .single()
}

export async function updateMilestone(id, values) {
  return supabase
    .from('organization_milestones')
    .update(toMilestonePayload(values))
    .eq('id', id)
    .select(milestoneColumns)
    .single()
}

export async function deleteMilestone(id) {
  return supabase.from('organization_milestones').delete().eq('id', id)
}

export function validateOrganizationPersonPhoto(file) {
  return validateMediaFile(file)
}

export function uploadOrganizationPersonPhoto(file) {
  return uploadMedia(file, 'people')
}

export function removeOrganizationPersonPhoto(path) {
  return removeMedia(path)
}
