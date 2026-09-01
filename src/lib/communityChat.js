import { communityStarterMessages } from '../data/communityChat'
import { isSupabaseConfigured, supabase } from './supabase'

export const maxCommunityMessageLength = 1000
export const maxCommunityMentionCount = 20
export const maxCommunityAttachmentCount = 5
export const maxCommunityAttachmentSize = 10 * 1024 * 1024
export const maxCommunityAttachmentTotalSize = 25 * 1024 * 1024
export const communityAttachmentBucket = 'community-attachments'
export const communityAttachmentAccept = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/heic',
  'image/heif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
].join(',')

const communityAttachmentMimeTypes = new Set(communityAttachmentAccept.split(','))
const extensionMimeTypes = {
  '.avif': 'image/avif',
  '.csv': 'text/csv',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.webp': 'image/webp',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

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

function getCommunityAttachmentMimeType(file) {
  const declaredType = String(file?.type || '').trim().toLowerCase()
  if (communityAttachmentMimeTypes.has(declaredType)) return declaredType

  const fileName = String(file?.name || '').trim().toLowerCase()
  const extension = fileName.includes('.')
    ? fileName.slice(fileName.lastIndexOf('.'))
    : ''

  return extensionMimeTypes[extension] || ''
}

export function getCommunityAttachmentError(files) {
  const selectedFiles = Array.isArray(files) ? files.filter(Boolean) : []

  if (selectedFiles.length > maxCommunityAttachmentCount) {
    return new Error(
      `A message can include at most ${maxCommunityAttachmentCount} files.`,
    )
  }

  let totalSize = 0
  for (const file of selectedFiles) {
    const mimeType = getCommunityAttachmentMimeType(file)
    const size = Number(file?.size)

    if (!mimeType) {
      return new Error(
        'That file type is not supported. Use an image, PDF, text, or Office document.',
      )
    }

    if (!Number.isFinite(size) || size < 1) {
      return new Error('Each attachment must contain a file.')
    }

    if (size > maxCommunityAttachmentSize) {
      return new Error('Each attachment must be 10 MB or smaller.')
    }

    totalSize += size
  }

  if (totalSize > maxCommunityAttachmentTotalSize) {
    return new Error('Attachments cannot exceed 25 MB per message.')
  }

  return null
}

export function formatCommunityAttachmentSize(sizeBytes) {
  const size = Number(sizeBytes)
  if (!Number.isFinite(size) || size < 1) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function normalizeCommunityAttachment(row) {
  const sizeBytes = Number(row?.size_bytes ?? row?.sizeBytes)

  return {
    id: row?.attachment_id || row?.id || '',
    messageId: row?.message_id || row?.messageId || '',
    storagePath: row?.storage_path || row?.storagePath || '',
    fileName: row?.file_name || row?.fileName || 'Attachment',
    mimeType: row?.mime_type || row?.mimeType || 'application/octet-stream',
    sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : 0,
    createdAt: row?.created_at || row?.createdAt || '',
    url: row?.url || row?.signed_url || row?.signedUrl || '',
  }
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
    attachments: Array.isArray(row.attachments)
      ? row.attachments.map(normalizeCommunityAttachment)
      : [],
    canDelete: Boolean(row.can_delete ?? row.canDelete),
  }
}

export function normalizeCommunityMember(row) {
  return {
    profileId: row.profile_id || row.profileId || row.id || '',
    fullName:
      row.display_name ||
      row.full_name ||
      row.fullName ||
      row.nickname ||
      'Member',
    avatarPath: row.avatar_path || row.avatarPath || '',
    role: row.role || 'student',
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

  if (error) {
    return {
      data: getStarterMessages(roomId),
      error,
    }
  }

  const messages = (data || []).map(normalizeCommunityMessage)
  let attachmentsResult
  try {
    attachmentsResult = await supabase.rpc(
      'list_community_message_attachments',
      {
        selected_room_id: roomId,
      },
    )
  } catch {
    return { data: messages, error: null }
  }

  if (attachmentsResult.error) {
    return { data: messages, error: null }
  }

  const attachmentRows = (attachmentsResult.data || []).map(
    normalizeCommunityAttachment,
  )
  if (!attachmentRows.length) return { data: messages, error: null }

  const hydratedAttachments = await Promise.all(
    attachmentRows.map(async (attachment) => {
      if (!attachment.storagePath) return attachment

      try {
        const { data: signedData, error: signedError } = await supabase.storage
          .from(communityAttachmentBucket)
          .createSignedUrl(attachment.storagePath, 60 * 60)

        return {
          ...attachment,
          url: signedError ? '' : signedData?.signedUrl || '',
        }
      } catch {
        return { ...attachment, url: '' }
      }
    }),
  )

  const attachmentsByMessage = new Map()
  hydratedAttachments.forEach((attachment) => {
    const current = attachmentsByMessage.get(attachment.messageId) || []
    current.push(attachment)
    attachmentsByMessage.set(attachment.messageId, current)
  })

  return {
    data: messages.map((message) => ({
      ...message,
      attachments: attachmentsByMessage.get(message.id) || [],
    })),
    error: null,
  }
}

export async function getCommunityMembers() {
  if (!isSupabaseConfigured) return { data: [], error: null }

  const { data, error } = await supabase.rpc('list_community_members')

  return {
    data: error ? [] : (data || []).map(normalizeCommunityMember),
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

export async function createCommunityMessage(
  roomId,
  body,
  replyToMessageId = null,
  mentionedProfileIds = [],
) {
  const messageResult = validateMessage(body)

  if (messageResult instanceof Error) return { data: null, error: messageResult }

  const mentionIds = [
    ...new Set(
      (Array.isArray(mentionedProfileIds) ? mentionedProfileIds : []).filter(
        Boolean,
      ),
    ),
  ]

  if (mentionIds.length > maxCommunityMentionCount) {
    return {
      data: null,
      error: new Error(
        `A message can mention at most ${maxCommunityMentionCount} members.`,
      ),
    }
  }

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
    selected_mentioned_profile_ids: mentionIds,
  })
  const row = Array.isArray(result.data) ? result.data[0] : result.data

  return {
    data: row ? normalizeCommunityMessage(row) : null,
    error: result.error,
  }
}

function createAttachmentId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()

  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-')
}

function toCommunityAttachmentError(error, fallbackMessage) {
  return error instanceof Error
    ? error
    : new Error(error?.message || fallbackMessage)
}

export async function uploadCommunityMessageAttachments(messageId, files = []) {
  const selectedFiles = Array.isArray(files) ? files.filter(Boolean) : []
  const validationError = getCommunityAttachmentError(selectedFiles)
  if (validationError) return { data: null, error: validationError }
  if (!selectedFiles.length) return { data: [], error: null }

  if (!supabase) {
    return {
      data: null,
      error: new Error('Live room chat is not configured yet.'),
    }
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return {
      data: null,
      error: toCommunityAttachmentError(
        userError,
        'You must be signed in to send attachments.',
      ),
    }
  }

  const bucket = supabase.storage.from(communityAttachmentBucket)
  const uploadedPaths = []
  const attachmentRecords = []

  try {
    for (const file of selectedFiles) {
      const mimeType = getCommunityAttachmentMimeType(file)
      const storagePath = `${userData.user.id}/${messageId}/${createAttachmentId()}`
      const uploadResult = await bucket.upload(storagePath, file, {
        cacheControl: '3600',
        contentType: mimeType,
        upsert: false,
      })

      if (uploadResult.error) throw uploadResult.error

      uploadedPaths.push(storagePath)
      attachmentRecords.push({
        storage_path: storagePath,
        file_name: String(file.name || 'Attachment').trim().slice(0, 255),
        mime_type: mimeType,
        size_bytes: Number(file.size),
      })
    }

    const metadataResult = await supabase.rpc(
      'add_community_message_attachments',
      {
        selected_message_id: messageId,
        selected_attachments: attachmentRecords,
      },
    )

    if (metadataResult.error) throw metadataResult.error

    return {
      data: (metadataResult.data || []).map(normalizeCommunityAttachment),
      error: null,
    }
  } catch (error) {
    if (uploadedPaths.length) {
      await bucket.remove(uploadedPaths).catch(() => {})
    }

    return {
      data: null,
      error: toCommunityAttachmentError(
        error,
        'The attachments could not be sent with this message.',
      ),
    }
  }
}

export async function deleteCommunityMessage(messageId, attachments = []) {
  if (!supabase) {
    return {
      data: null,
      error: new Error('Live room chat is not configured yet.'),
    }
  }

  const result = await supabase.rpc('delete_community_message', {
    selected_message_id: messageId,
  })

  if (!result.error) {
    const storagePaths = (Array.isArray(attachments) ? attachments : [])
      .map((attachment) => attachment?.storagePath)
      .filter(Boolean)

    if (storagePaths.length) {
      await supabase.storage
        .from(communityAttachmentBucket)
        .remove(storagePaths)
        .catch(() => {})
    }
  }

  return result
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
