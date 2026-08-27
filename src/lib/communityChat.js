import { communityStarterMessages } from '../data/communityChat'
import { isSupabaseConfigured, supabase } from './supabase'

export const maxCommunityMessageLength = 1000

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

export function isCommunityChatSchemaMissing(error) {
  const message = error?.message?.toLowerCase() || ''

  return (
    ['42P01', '42703', '42883', 'PGRST202', 'PGRST204', 'PGRST205', '404'].includes(
      error?.code,
    ) ||
    message.includes('community_messages') ||
    message.includes('community message') ||
    message.includes('schema cache')
  )
}

export function getFriendlyCommunityChatError(error) {
  const message = error?.message?.toLowerCase() || ''

  if (message.includes('approved account required')) {
    return 'Messaging is locked until an administrator approves your account.'
  }

  if (isCommunityChatSchemaMissing(error)) {
    return 'Room chat preview is active. Run supabase/community-chat.sql in the Supabase SQL Editor to enable live messages.'
  }

  return error?.message || 'Room messages could not be loaded right now.'
}

export function normalizeCommunityMessage(row) {
  const replyToMessageId =
    row.reply_to_message_id || row.replyToMessageId || null

  return {
    id: row.id,
    roomId: row.room_id || row.roomId,
    profileId: row.profile_id || row.profileId || row.user_id || '',
    fullName:
      row.full_name || row.fullName || row.author_name || row.authorName || 'Member',
    avatarPath: row.avatar_path || row.avatarPath || '',
    role: row.role || row.author_role || row.authorRole || 'student',
    body: row.body || '',
    createdAt: row.created_at || row.createdAt || '',
    updatedAt: row.updated_at || row.updatedAt || row.created_at || '',
    date: formatDate(row.created_at || row.createdAt),
    replyToMessageId,
    replyTo: replyToMessageId
      ? {
          id: replyToMessageId,
          fullName:
            row.reply_to_full_name || row.replyToFullName || 'Member',
          avatarPath: row.reply_to_avatar_path || row.replyToAvatarPath || '',
          body:
            row.reply_to_body ||
            row.replyToBody ||
            'Original message unavailable.',
          createdAt:
            row.reply_to_created_at || row.replyToCreatedAt || '',
        }
      : null,
    canDelete: Boolean(row.can_delete ?? row.canDelete),
  }
}

export function getStarterMessages(roomId) {
  return communityStarterMessages
    .filter((message) => message.roomId === roomId)
    .map(normalizeCommunityMessage)
}

export async function getCommunityMessages(roomId) {
  if (!isSupabaseConfigured) {
    return { data: getStarterMessages(roomId), error: null }
  }

  const { data, error } = await supabase.rpc('list_community_messages', {
    selected_room_id: roomId,
  })

  return {
    data: error ? getStarterMessages(roomId) : (data || []).map(normalizeCommunityMessage),
    error,
  }
}

function validateMessage(value) {
  const cleanValue = String(value || '').trim()

  if (!cleanValue) return new Error('Message cannot be empty.')
  if (cleanValue.length > maxCommunityMessageLength) {
    return new Error(
      `Message must be ${maxCommunityMessageLength} characters or fewer.`,
    )
  }

  return { cleanValue, error: null }
}

export async function createCommunityMessage(roomId, body, replyToMessageId = null) {
  const messageResult = validateMessage(body)

  if (messageResult instanceof Error) return { data: null, error: messageResult }

  if (!supabase) {
    return {
      data: null,
      error: new Error('Live room chat is not configured yet.'),
    }
  }

  const result = await supabase.rpc('create_community_message', {
    selected_room_id: roomId,
    message_body: messageResult.cleanValue,
    selected_reply_to_message_id: replyToMessageId,
  })
  const row = Array.isArray(result.data) ? result.data[0] : result.data

  return {
    data: row ? normalizeCommunityMessage(row) : null,
    error: result.error,
  }
}

export async function deleteCommunityMessage(messageId) {
  if (!supabase) {
    return {
      data: null,
      error: new Error('Live room chat is not configured yet.'),
    }
  }

  return supabase.rpc('delete_community_message', {
    selected_message_id: messageId,
  })
}

export function subscribeToCommunityMessages(roomId, onRefresh, onError) {
  if (!supabase || !roomId) return () => {}

  let isActive = true
  const channel = supabase
    .channel(`community-room-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'community_messages',
        filter: `room_id=eq.${roomId}`,
      },
      () => {
        Promise.resolve()
          .then(onRefresh)
          .catch((error) => {
            if (isActive) onError?.(error)
          })
      },
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' && isActive) {
        onError?.(new Error('Live room updates are unavailable right now.'))
      }
    })

  return () => {
    isActive = false
    supabase.removeChannel(channel).catch(() => {})
  }
}
