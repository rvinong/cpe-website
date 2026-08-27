import {
  communityRooms,
  communityStarterThreads,
} from '../data/community'
import { isSupabaseConfigured, supabase } from './supabase'

export const maxCommunityPostTitleLength = 120
export const maxCommunityPostBodyLength = 1200
export const maxCommunityCommentLength = 1000

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila',
})

function formatDate(value) {
  if (!value || value === 'Preview') return value || ''

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date)
}

export function isCommunitySchemaMissing(error) {
  const message = error?.message?.toLowerCase() || ''

  return (
    ['42P01', '42703', '42883', 'PGRST202', 'PGRST204', 'PGRST205', '404'].includes(
      error?.code,
    ) ||
    message.includes('community_') ||
    message.includes('community ') ||
    message.includes('schema cache')
  )
}

export function getFriendlyCommunityError(error) {
  if (isCommunitySchemaMissing(error)) {
    return 'The Community Hub is ready in the interface. Run supabase/community.sql in the Supabase SQL Editor to enable the room directory.'
  }

  return error?.message || 'Community content could not be loaded right now.'
}

export function normalizeCommunityRoom(row) {
  return {
    id: row.id,
    title: row.title || row.id,
    shortTitle: row.short_title || row.shortTitle || row.title || row.id,
    description: row.description || '',
    tone: row.tone || 'blue',
    isLocked: Boolean(row.is_locked ?? row.isLocked),
    isStaffOnly: Boolean(row.is_staff_only ?? row.isStaffOnly),
    sortOrder: Number(row.sort_order ?? row.sortOrder) || 0,
  }
}

export function normalizeCommunityComment(row) {
  return {
    id: row.id,
    postId: row.post_id || row.postId,
    profileId: row.profile_id || row.profileId || '',
    fullName: row.full_name || row.fullName || 'Member',
    avatarPath: row.avatar_path || row.avatarPath || '',
    body: row.body || '',
    createdAt: row.created_at || row.createdAt || '',
    updatedAt: row.updated_at || row.updatedAt || row.created_at || '',
    date: formatDate(row.created_at || row.createdAt),
    canDelete: Boolean(row.can_delete ?? row.canDelete),
  }
}

export function normalizeCommunityPost(row) {
  return {
    id: row.id,
    roomId: row.room_id || row.roomId,
    title: row.title || '',
    body: row.body || '',
    authorName: row.author_name || row.full_name || row.authorName || 'Member',
    authorRole: row.author_role || row.role || row.authorRole || 'student',
    profileId: row.profile_id || row.profileId || '',
    avatarPath: row.avatar_path || row.avatarPath || '',
    isPinned: Boolean(row.is_pinned ?? row.isPinned),
    commentCount: Number(row.comment_count ?? row.commentCount) || 0,
    createdAt: row.created_at || row.createdAt || '',
    updatedAt: row.updated_at || row.updatedAt || '',
    date: formatDate(row.created_at || row.createdAt),
    canDelete: Boolean(row.can_delete ?? row.canDelete),
  }
}

function getStarterPost(postId) {
  return communityStarterThreads.find((post) => post.id === postId)
}

export function getStarterPosts(roomId) {
  return communityStarterThreads
    .filter((post) => post.roomId === roomId)
    .map(normalizeCommunityPost)
}

export function getStarterComments(postId) {
  const post = getStarterPost(postId)
  return (post?.comments || []).map((comment) =>
    normalizeCommunityComment({
      ...comment,
      post_id: postId,
    }),
  )
}

export async function getCommunityRooms() {
  if (!isSupabaseConfigured) {
    return { data: communityRooms, error: null }
  }

  const { data, error } = await supabase
    .from('community_rooms')
    .select('id, title, short_title, description, tone, is_locked, is_staff_only, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return {
    data: error ? communityRooms : (data || []).map(normalizeCommunityRoom),
    error,
  }
}

export async function getCommunityPosts(roomId) {
  if (!isSupabaseConfigured) {
    return { data: getStarterPosts(roomId), error: null }
  }

  const { data, error } = await supabase.rpc('list_community_posts', {
    selected_room_id: roomId,
  })

  return {
    data: error ? getStarterPosts(roomId) : (data || []).map(normalizeCommunityPost),
    error,
  }
}

export async function getCommunityComments(postId) {
  if (!isSupabaseConfigured) {
    return { data: getStarterComments(postId), error: null }
  }

  const { data, error } = await supabase.rpc('list_community_comments', {
    selected_post_id: postId,
  })

  return {
    data: error ? getStarterComments(postId) : (data || []).map(normalizeCommunityComment),
    error,
  }
}

function validateText(value, label, maxLength) {
  const cleanValue = String(value || '').trim()

  if (!cleanValue) return new Error(`${label} cannot be empty.`)
  if (cleanValue.length > maxLength) {
    return new Error(`${label} must be ${maxLength} characters or fewer.`)
  }

  return { cleanValue, error: null }
}

export async function createCommunityPost(roomId, { title, body }) {
  const titleResult = validateText(
    title,
    'Post title',
    maxCommunityPostTitleLength,
  )
  const bodyResult = validateText(
    body,
    'Post body',
    maxCommunityPostBodyLength,
  )

  if (titleResult instanceof Error) return { data: null, error: titleResult }
  if (bodyResult instanceof Error) return { data: null, error: bodyResult }

  if (!supabase) {
    return {
      data: null,
      error: new Error('Live community posting is not configured yet.'),
    }
  }

  const result = await supabase.rpc('create_community_post', {
    selected_room_id: roomId,
    post_title: titleResult.cleanValue,
    post_body: bodyResult.cleanValue,
  })
  const row = Array.isArray(result.data) ? result.data[0] : result.data

  return { data: row ? normalizeCommunityPost(row) : null, error: result.error }
}

export async function createCommunityComment(postId, body) {
  const bodyResult = validateText(body, 'Comment', maxCommunityCommentLength)

  if (bodyResult instanceof Error) return { data: null, error: bodyResult }

  if (!supabase) {
    return {
      data: null,
      error: new Error('Live community posting is not configured yet.'),
    }
  }

  const result = await supabase.rpc('create_community_comment', {
    selected_post_id: postId,
    comment_body: bodyResult.cleanValue,
  })
  const row = Array.isArray(result.data) ? result.data[0] : result.data

  return { data: row ? normalizeCommunityComment(row) : null, error: result.error }
}
