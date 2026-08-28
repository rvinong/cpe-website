import { motion as Motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileText,
  Hash,
  Info,
  ImagePlus,
  LockKeyhole,
  MessageCircle,
  MessageSquareText,
  Paperclip,
  Radio,
  Reply,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ProfileAvatar from '../components/ProfileAvatar'
import Reveal from '../components/Reveal'
import useAuth from '../context/useAuth'
import { communityRooms } from '../data/community'
import { useMotionPreferences } from '../hooks/useMotionPreferences'
import {
  getCommunityRooms,
  getFriendlyCommunityError,
} from '../lib/community'
import {
  createCommunityMessage,
  deleteCommunityMessage,
  communityAttachmentAccept,
  formatCommunityAttachmentSize,
  getCommunityAttachmentError,
  getCommunityMembers,
  getCommunityMessages,
  getFriendlyCommunityChatError,
  getStarterMessages,
  maxCommunityMessageLength,
  maxCommunityAttachmentCount,
  maxCommunityAttachmentSize,
  notifyCommunityMentions,
  subscribeToCommunityMessages,
  uploadCommunityMessageAttachments,
} from '../lib/communityChat'
import { getDisplayName } from '../lib/accountProfile'

const roomIcons = {
  general: MessageCircle,
  'academic-help': BookOpen,
  'events-talk': CalendarDays,
  'announcements-qa': MessageSquareText,
  'resource-requests': ShieldCheck,
  'officer-notices': BadgeCheck,
}

function getInitialRoomId() {
  const fallbackRoomId = communityRooms[0]?.id || ''
  if (typeof window === 'undefined') return fallbackRoomId

  const requestedRoomId = new URLSearchParams(window.location.search).get('room')
  return communityRooms.some((room) => room.id === requestedRoomId)
    ? requestedRoomId
    : fallbackRoomId
}

function roleLabel(role) {
  const labels = {
    admin: 'Administrator',
    editor: 'Editor',
    student: 'Member',
  }

  return labels[role] || 'Member'
}

function findMention(value, cursorPosition) {
  const beforeCursor = value.slice(0, cursorPosition)
  const match = beforeCursor.match(/(^|\s)@([^\s@]*)$/)
  if (!match) return null

  return {
    start: beforeCursor.length - match[0].length + match[1].length,
    query: match[2],
  }
}

function getMentionSuggestions(members, query, currentUserId) {
  const normalizedQuery = String(query || '').trim().toLowerCase()

  return members
    .filter((member) => member.profileId !== currentUserId)
    .filter((member) =>
      String(member.fullName || 'Member')
        .toLowerCase()
        .includes(normalizedQuery),
    )
    .sort((first, second) => {
      const firstName = String(first.fullName || 'Member').toLowerCase()
      const secondName = String(second.fullName || 'Member').toLowerCase()
      const firstStartsWithQuery = firstName.startsWith(normalizedQuery)
      const secondStartsWithQuery = secondName.startsWith(normalizedQuery)

      if (firstStartsWithQuery !== secondStartsWithQuery) {
        return firstStartsWithQuery ? -1 : 1
      }

      return firstName.localeCompare(secondName)
    })
    .slice(0, 7)
}

function escapeRegExp(value) {
  return value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

function hasMentionToken(value, memberName) {
  const name = String(memberName || '').trim()
  if (!name) return false

  return new RegExp(
    '(^|\\s)@' + escapeRegExp(name) + '(?=\\s|$|[.,!?])',
    'iu',
  ).test(String(value || ''))
}

function renderMessageBody(body, members) {
  const text = String(body || '')
  const names = [
    ...new Set(
      (members || [])
        .map((member) => String(member.fullName || '').trim())
        .filter(Boolean),
    ),
  ].sort((first, second) => second.length - first.length)

  if (!names.length) return text

  const pattern = new RegExp(
    '(^|\\s)@(' +
      names.map(escapeRegExp).join('|') +
      ')(?=\\s|$|[.,!?])',
    'giu',
  )
  const parts = []
  let lastIndex = 0

  for (const match of text.matchAll(pattern)) {
    const matchIndex = match.index ?? 0
    const mentionStart = matchIndex + match[1].length
    parts.push(text.slice(lastIndex, mentionStart))
    parts.push(
      <span
        key={'mention-' + matchIndex}
        className="community-message-mention"
      >
        {'@' + match[2]}
      </span>,
    )
    lastIndex = mentionStart + match[2].length + 1
  }

  parts.push(text.slice(lastIndex))
  return parts
}

function RoomButton({ active, onClick, room }) {
  const Icon = roomIcons[room.id] || MessageCircle

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`community-room-button ${active ? 'community-room-button-active' : ''}`}
    >
      <span className="community-room-icon">
        <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="community-room-copy">
        <span className="community-room-title">{room.title}</span>
        <span className="community-room-description">
          {room.isStaffOnly ? 'Staff-only notices' : room.shortTitle || 'Public room'}
        </span>
      </span>
      {room.isStaffOnly && <LockKeyhole size={13} aria-hidden="true" />}
    </button>
  )
}

function MessageComposer({
  currentUserId,
  disabled,
  error,
  isSubmitting,
  mentionMembers = [],
  onCancelReply,
  onSubmit,
  replyingTo,
}) {
  const [body, setBody] = useState('')
  const [selectedMentions, setSelectedMentions] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [attachmentError, setAttachmentError] = useState('')
  const [mention, setMention] = useState(null)
  const [activeMentionIndex, setActiveMentionIndex] = useState(0)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const selectedFilesRef = useRef([])
  const canSubmit = Boolean(body.trim()) && !disabled && !isSubmitting
  const mentionSuggestions = useMemo(
    () =>
      getMentionSuggestions(
        mentionMembers,
        mention?.query || '',
        currentUserId,
      ),
    [currentUserId, mention, mentionMembers],
  )
  const showMentionMenu = Boolean(
    mention && (mentionSuggestions.length || mentionMembers.length),
  )

  useEffect(() => {
    if (replyingTo) inputRef.current?.focus()
  }, [replyingTo])

  useEffect(() => {
    selectedFilesRef.current = selectedFiles
  }, [selectedFiles])

  useEffect(
    () => () => {
      selectedFilesRef.current.forEach((selectedFile) => {
        if (selectedFile.previewUrl) {
          globalThis.URL?.revokeObjectURL(selectedFile.previewUrl)
        }
      })
    },
    [],
  )

  const clearSelectedFiles = () => {
    selectedFiles.forEach((selectedFile) => {
      if (selectedFile.previewUrl) {
        globalThis.URL?.revokeObjectURL(selectedFile.previewUrl)
      }
    })
    setSelectedFiles([])
  }

  const handleFileChange = (event) => {
    const incomingFiles = Array.from(event.target.files || [])
    event.target.value = ''
    if (!incomingFiles.length) return

    const existingKeys = new Set(
      selectedFiles.map(
        (selectedFile) =>
          `${selectedFile.file.name}:${selectedFile.file.size}:${selectedFile.file.lastModified}`,
      ),
    )
    const uniqueIncomingFiles = incomingFiles.filter((file) => {
      const fileKey = `${file.name}:${file.size}:${file.lastModified}`
      if (existingKeys.has(fileKey)) return false
      existingKeys.add(fileKey)
      return true
    })
    const nextFiles = [
      ...selectedFiles.map((selectedFile) => selectedFile.file),
      ...uniqueIncomingFiles,
    ]
    const validationError = getCommunityAttachmentError(nextFiles)

    if (validationError) {
      setAttachmentError(validationError.message)
      return
    }

    setSelectedFiles((current) => [
      ...current,
      ...uniqueIncomingFiles.map((file, index) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
        file,
        previewUrl:
          String(file.type || '').startsWith('image/') &&
          globalThis.URL?.createObjectURL
            ? globalThis.URL.createObjectURL(file)
            : '',
      })),
    ])
    setAttachmentError('')
  }

  const handleRemoveFile = (fileId) => {
    const selectedFile = selectedFiles.find((item) => item.id === fileId)
    if (selectedFile?.previewUrl) {
      globalThis.URL?.revokeObjectURL(selectedFile.previewUrl)
    }
    setSelectedFiles((current) => current.filter((item) => item.id !== fileId))
    setAttachmentError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return

    const didSubmit = await onSubmit(
      body,
      replyingTo?.id || null,
      selectedMentions.map((member) => member.profileId),
      selectedFiles.map((selectedFile) => selectedFile.file),
    )
    if (didSubmit) {
      setBody('')
      setSelectedMentions([])
      clearSelectedFiles()
      setAttachmentError('')
      setMention(null)
      setActiveMentionIndex(0)
      onCancelReply?.()
    }
  }

  const handleMentionSelect = (member) => {
    if (!mention) return

    const cursorPosition = inputRef.current?.selectionStart ?? body.length
    const beforeMention = body.slice(0, mention.start)
    const afterCursor = body.slice(cursorPosition)
    const mentionText = '@' + String(member.fullName || 'Member').trim() + ' '
    const nextBody = beforeMention + mentionText + afterCursor
    const nextCursorPosition = beforeMention.length + mentionText.length

    setBody(nextBody)
    setSelectedMentions((current) => [
      ...current.filter(
        (selectedMember) =>
          selectedMember.profileId !== member.profileId &&
          hasMentionToken(nextBody, selectedMember.fullName),
      ),
      member,
    ])
    setMention(null)
    setActiveMentionIndex(0)
    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(
        nextCursorPosition,
        nextCursorPosition,
      )
    })
  }

  const handleKeyDown = (event) => {
    if (showMentionMenu && mentionSuggestions.length) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveMentionIndex(
          (current) => (current + 1) % mentionSuggestions.length,
        )
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveMentionIndex(
          (current) =>
            (current - 1 + mentionSuggestions.length) %
            mentionSuggestions.length,
        )
        return
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        handleMentionSelect(mentionSuggestions[activeMentionIndex])
        return
      }
    }

    if (event.key === 'Escape' && showMentionMenu) {
      event.preventDefault()
      setMention(null)
      setActiveMentionIndex(0)
      return
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="community-chat-composer">
      {replyingTo && (
        <div className="community-reply-context">
          <div className="community-reply-context-copy">
            <span className="community-reply-context-label">
              <Reply size={13} aria-hidden="true" />
              Replying to {replyingTo.fullName}
            </span>
            <p>{replyingTo.body}</p>
          </div>
          <button
            type="button"
            className="community-reply-context-close"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}
      {selectedFiles.length > 0 && (
        <div className="community-selected-attachments" aria-label="Selected attachments">
          {selectedFiles.map((selectedFile) => {
            const isImage = String(selectedFile.file.type || '').startsWith(
              'image/',
            )

            return (
              <div className="community-selected-attachment" key={selectedFile.id}>
                {selectedFile.previewUrl && isImage ? (
                  <img
                    src={selectedFile.previewUrl}
                    alt=""
                    className="community-selected-attachment-preview"
                  />
                ) : (
                  <span className="community-selected-attachment-icon">
                    {isImage ? (
                      <ImagePlus size={15} aria-hidden="true" />
                    ) : (
                      <FileText size={15} aria-hidden="true" />
                    )}
                  </span>
                )}
                <span className="community-selected-attachment-copy">
                  <span className="community-selected-attachment-name">
                    {selectedFile.file.name}
                  </span>
                  <span className="community-selected-attachment-size">
                    {formatCommunityAttachmentSize(selectedFile.file.size)}
                  </span>
                </span>
                <button
                  type="button"
                  className="community-selected-attachment-remove"
                  onClick={() => handleRemoveFile(selectedFile.id)}
                  aria-label={`Remove ${selectedFile.file.name}`}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            )
          })}
        </div>
      )}
      <label className="sr-only" htmlFor="community-message-body">
        Write a message to this room
      </label>
      <div className="community-chat-input-wrap">
        <textarea
          ref={inputRef}
          id="community-message-body"
          value={body}
          onChange={(event) => {
            const nextBody = event.target.value
            const cursorPosition =
              event.target.selectionStart ?? nextBody.length
            setBody(nextBody)
            setSelectedMentions((current) =>
              current.filter((member) =>
                hasMentionToken(nextBody, member.fullName),
              ),
            )
            setMention(findMention(nextBody, cursorPosition))
            setActiveMentionIndex(0)
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setMention(null)}
          maxLength={maxCommunityMessageLength}
          rows="1"
          placeholder={replyingTo ? 'Write your reply...' : 'Message this room...'}
          disabled={disabled || isSubmitting}
          aria-autocomplete="list"
          aria-controls={showMentionMenu ? 'community-mention-list' : undefined}
          aria-expanded={showMentionMenu}
          aria-activedescendant={
            showMentionMenu && mentionSuggestions[activeMentionIndex]
              ? 'community-mention-option-' + activeMentionIndex
              : undefined
          }
          className="community-input community-chat-input resize-none"
        />
        {showMentionMenu && (
          <div
            id="community-mention-list"
            className="community-mention-menu"
            role="listbox"
            aria-label="Mention a member"
          >
            <p className="community-mention-menu-label">
              {mention?.query ? 'Matching members' : 'Mention a member'}
            </p>
            {mentionSuggestions.length ? (
              mentionSuggestions.map((member, index) => (
                <button
                  key={member.profileId}
                  id={'community-mention-option-' + index}
                  type="button"
                  role="option"
                  aria-selected={index === activeMentionIndex}
                  className={
                    'community-mention-option ' +
                    (index === activeMentionIndex
                      ? 'community-mention-option-active'
                      : '')
                  }
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => handleMentionSelect(member)}
                >
                  <ProfileAvatar
                    path={member.avatarPath}
                    name={member.fullName}
                    className="community-mention-avatar size-8 rounded-lg"
                    textClassName="text-[0.65rem]"
                  />
                  <span className="community-mention-copy">
                    <span className="community-mention-name">
                      {member.fullName}
                    </span>
                    <span className="community-mention-role">
                      {roleLabel(member.role)}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="community-mention-empty">
                No other approved members match.
              </p>
            )}
          </div>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className="community-chat-send"
          aria-label="Send message"
        >
          <Send size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="community-composer-tools">
        <input
          ref={fileInputRef}
          type="file"
          className="community-attachment-input"
          accept={communityAttachmentAccept}
          multiple
          onChange={handleFileChange}
          disabled={disabled || isSubmitting}
        />
        <button
          type="button"
          className="community-attachment-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSubmitting}
        >
          <Paperclip size={14} aria-hidden="true" />
          Add file or image
        </button>
        <span className="community-attachment-limit">
          {selectedFiles.length}/{maxCommunityAttachmentCount} files, up to{' '}
          {maxCommunityAttachmentSize / (1024 * 1024)} MB each
        </span>
      </div>
      <div className="community-chat-composer-meta">
        <span>
          Enter to send. Shift + Enter for a new line. Mentioned members may
          receive an email.
        </span>
        <span>{maxCommunityMessageLength - body.length}</span>
      </div>
      {attachmentError && (
        <p className="community-form-error" role="alert">
          {attachmentError}
        </p>
      )}
      {error && <p className="community-form-error">{error}</p>}
    </form>
  )
}

function CommunityMessageAccess({ room, user }) {
  const isStaffRoom = Boolean(room?.isStaffOnly)
  const title = isStaffRoom
    ? 'This room is restricted'
    : user
      ? 'Messages unlock after approval'
      : 'Sign in to view messages'
  const description = isStaffRoom
    ? 'Only approved officers, editors, and administrators can view this room.'
    : user
      ? 'An administrator must approve your account before room messages become visible.'
      : 'Public rooms are available to approved members of the community.'

  return (
    <div className="community-message-access" role="status">
      <span className="community-message-access-icon">
        <LockKeyhole size={23} aria-hidden="true" />
      </span>
      <p>{title}</p>
      <span>{description}</span>
      {!user && (
        <Link
          to="/account?mode=login&redirect=%2Fcommunity"
          className="community-access-link"
        >
          Sign in
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

function MessageItem({
  canReply,
  currentUserId,
  message,
  mentionMembers,
  onDelete,
  onReply,
  shouldReduceMotion,
}) {
  const isOwnMessage = Boolean(currentUserId && message.profileId === currentUserId)

  return (
    <Motion.article
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0.01 : 0.2 }}
      className={`community-message-row ${isOwnMessage ? 'community-message-row-own' : ''}`}
      id={`community-message-${message.id}`}
      data-message-id={message.id}
    >
      <ProfileAvatar
        path={message.avatarPath}
        name={message.fullName}
        className="community-message-avatar size-9 rounded-xl"
        textClassName="text-xs"
      />
      <div className="community-message-content">
        <div className="community-message-meta">
          <span className="community-message-author">{message.fullName}</span>
          <span className="community-role-badge">{roleLabel(message.role)}</span>
          <span className="community-message-time">{message.date || 'Recently'}</span>
        </div>
        <div className="community-message-bubble">
          {message.replyTo && (
            <div className="community-message-reply-quote">
              <span>
                <Reply size={12} aria-hidden="true" />
                {message.replyTo.fullName}
              </span>
              <p>{renderMessageBody(message.replyTo.body, mentionMembers)}</p>
            </div>
          )}
          <p>{renderMessageBody(message.body, mentionMembers)}</p>
          {message.attachments?.length > 0 && (
            <div className="community-message-attachments">
              {message.attachments.map((attachment) => {
                const isImage = String(attachment.mimeType || '').startsWith(
                  'image/',
                )
                const attachmentSize = formatCommunityAttachmentSize(
                  attachment.sizeBytes,
                )
                const attachmentLabel = `${attachment.fileName}${
                  attachmentSize ? `, ${attachmentSize}` : ''
                }`

                if (attachment.url && isImage) {
                  return (
                    <a
                      key={attachment.id || attachment.storagePath}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="community-message-image-link"
                      aria-label={`Open ${attachmentLabel}`}
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.fileName}
                        className="community-message-image"
                        loading="lazy"
                      />
                      <span>{attachment.fileName}</span>
                    </a>
                  )
                }

                if (attachment.url) {
                  return (
                    <a
                      key={attachment.id || attachment.storagePath}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      download={attachment.fileName}
                      className="community-message-file"
                    >
                      <FileText size={16} aria-hidden="true" />
                      <span>
                        <strong>{attachment.fileName}</strong>
                        {attachmentSize && <small>{attachmentSize}</small>}
                      </span>
                    </a>
                  )
                }

                return (
                  <div
                    key={attachment.id || attachment.storagePath}
                    className="community-message-file community-message-file-unavailable"
                  >
                    <FileText size={16} aria-hidden="true" />
                    <span>
                      <strong>{attachment.fileName}</strong>
                      <small>Attachment unavailable</small>
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {(canReply || message.canDelete || isOwnMessage) && (
          <div className="community-message-actions">
            {canReply && (
              <button
                type="button"
                className="community-message-reply"
                onClick={() => onReply(message)}
              >
                <Reply size={12} aria-hidden="true" />
                Reply
              </button>
            )}
            {(message.canDelete || isOwnMessage) && (
              <button
                type="button"
                className="community-message-delete"
                onClick={() => onDelete(message)}
              >
                <Trash2 size={12} aria-hidden="true" />
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </Motion.article>
  )
}

function CommunityRoomInfo({ canSend, canViewMessages, className = '', room }) {
  return (
    <aside
      id="community-room-info"
      className={`community-room-info ${className}`.trim()}
      aria-label="Room information"
    >
      <div className="community-room-info-heading">
        <span className="community-room-info-icon">
          <Info size={17} aria-hidden="true" />
        </span>
        <div>
          <p className="community-room-info-kicker">Room details</p>
          <h2>About this room</h2>
        </div>
      </div>

      <div className="community-room-info-card">
        <span className="community-room-info-hash" aria-hidden="true">
          <Hash size={22} />
        </span>
        <h3>{room?.title || 'Community room'}</h3>
        <p>{room?.description || 'Public messages for the CpE community.'}</p>
      </div>

      <dl className="community-room-facts">
        <div>
          <dt><UsersRound size={14} aria-hidden="true" /> Visibility</dt>
          <dd>{room?.isStaffOnly ? 'Approved staff only' : 'Approved members only'}</dd>
        </div>
        <div>
          <dt><Radio size={14} aria-hidden="true" /> Posting</dt>
          <dd>{canSend ? 'You can send messages' : 'Approved members only'}</dd>
        </div>
        <div>
          <dt><MessageCircle size={14} aria-hidden="true" /> Reading</dt>
          <dd>{canViewMessages ? 'Messages unlocked' : 'Approval required'}</dd>
        </div>
      </dl>

      <div className="community-room-info-note">
        <ShieldCheck size={15} aria-hidden="true" />
        <p>Use official pages for confirmed announcements, schedules, and documents.</p>
      </div>
    </aside>
  )
}

function Community() {
  const { user, profile, isApprovedMember, canAccessAdmin, isConfigured } = useAuth()
  const { shouldReduceMotion } = useMotionPreferences()
  const [rooms, setRooms] = useState(communityRooms)
  const [selectedRoomId, setSelectedRoomId] = useState(getInitialRoomId)
  const [messages, setMessages] = useState(
    getStarterMessages(communityRooms[0]?.id || ''),
  )
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [loadedMessagesRoomId, setLoadedMessagesRoomId] = useState('')
  const [isCreatingMessage, setIsCreatingMessage] = useState(false)
  const [communityError, setCommunityError] = useState('')
  const [chatError, setChatError] = useState('')
  const [chatNotice, setChatNotice] = useState('')
  const [members, setMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [isRoomInfoOpen, setIsRoomInfoOpen] = useState(false)
  const messageListRef = useRef(null)

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) || rooms[0],
    [rooms, selectedRoomId],
  )
  const displayName = getDisplayName(profile, user, 'member')
  const canViewMessages = Boolean(
    user &&
      isApprovedMember &&
      selectedRoom &&
      (!selectedRoom.isStaffOnly || canAccessAdmin),
  )
  const canSend = canViewMessages
  const isLoadingMessages = Boolean(
    canViewMessages &&
      selectedRoom?.id &&
      loadedMessagesRoomId !== selectedRoom.id,
  )
  const visibleMessages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return messages

    return messages.filter((message) =>
      [message.body, message.fullName].some((value) =>
        String(value || '').toLowerCase().includes(query),
      ),
    )
  }, [messages, searchTerm])
  const isLiveChat =
    canViewMessages && isConfigured && !chatError && !communityError

  const handleSelectRoom = (roomId) => {
    if (roomId === selectedRoomId) return
    setSelectedRoomId(roomId)
    setMessages([])
    setLoadedMessagesRoomId('')
    setChatError('')
    setChatNotice('')
    setSearchTerm('')
    setReplyingTo(null)
    setIsRoomInfoOpen(false)
  }

  useEffect(() => {
    let isMounted = true

    getCommunityRooms()
      .then(({ data, error }) => {
        if (!isMounted) return
        const nextRooms = data?.length ? data : communityRooms
        setRooms(nextRooms)
        setSelectedRoomId((current) =>
          nextRooms.some((room) => room.id === current)
            ? current
            : nextRooms[0]?.id || '',
        )
        setCommunityError(error ? getFriendlyCommunityError(error) : '')
        setIsLoadingRooms(false)
      })
      .catch((error) => {
        if (!isMounted) return
        setRooms(communityRooms)
        setSelectedRoomId(communityRooms[0]?.id || '')
        setCommunityError(getFriendlyCommunityError(error))
        setIsLoadingRooms(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedRoom?.id) return undefined

    if (!canViewMessages) return undefined

    let isMounted = true

    getCommunityMessages(selectedRoom.id)
      .then(({ data, error }) => {
        if (!isMounted) return
        setMessages(error ? [] : data || [])
        setChatError(error ? getFriendlyCommunityChatError(error) : '')
        setLoadedMessagesRoomId(selectedRoom.id)
      })
      .catch((error) => {
        if (!isMounted) return
        setMessages([])
        setChatError(getFriendlyCommunityChatError(error))
        setLoadedMessagesRoomId(selectedRoom.id)
      })

    return () => {
      isMounted = false
    }
  }, [canViewMessages, selectedRoom?.id])

  useEffect(() => {
    if (
      !isConfigured ||
      !canViewMessages ||
      !selectedRoom?.id ||
      chatError
    ) {
      return undefined
    }

    let isMounted = true

    const refreshMessages = async () => {
      const { data, error } = await getCommunityMessages(selectedRoom.id)
      if (!isMounted) return
      if (error) {
        setMessages([])
        setChatError(getFriendlyCommunityChatError(error))
        return
      }
      setMessages(data || [])
    }

    return subscribeToCommunityMessages(
      selectedRoom.id,
      refreshMessages,
      (error) => {
        if (isMounted) setChatError(getFriendlyCommunityChatError(error))
      },
    )
  }, [canViewMessages, chatError, isConfigured, selectedRoom?.id])

  useEffect(() => {
    if (!canViewMessages) return undefined

    let isMounted = true

    getCommunityMembers()
      .then(({ data }) => {
        if (isMounted) setMembers(data || [])
      })
      .catch(() => {
        if (isMounted) setMembers([])
      })

    return () => {
      isMounted = false
    }
  }, [canViewMessages])

  useEffect(() => {
    const messageList = messageListRef.current
    if (!messageList || searchTerm.trim()) return
    messageList.scrollTop = messageList.scrollHeight
  }, [messages, searchTerm, selectedRoom?.id])

  const handleCreateMessage = async (
    body,
    replyToMessageId,
    mentionedProfileIds = [],
    files = [],
  ) => {
    if (!canSend || !selectedRoom?.id) return false
    setChatError('')
    setChatNotice('')
    setIsCreatingMessage(true)

    let result
    try {
      result = await createCommunityMessage(
        selectedRoom.id,
        body,
        replyToMessageId,
        mentionedProfileIds,
      )
    } catch (error) {
      setIsCreatingMessage(false)
      setChatError(getFriendlyCommunityChatError(error))
      return false
    }

    const { data, error } = result

    if (error || !data) {
      setIsCreatingMessage(false)
      setChatError(
        error
          ? getFriendlyCommunityChatError(error)
          : 'The message could not be sent.',
      )
      return false
    }

    setMessages((current) =>
      current.some((message) => message.id === data.id)
        ? current
        : [...current, data],
    )

    let deliveryNotice = ''

    if (files.length > 0) {
      let attachmentResult
      try {
        attachmentResult = await uploadCommunityMessageAttachments(data.id, files)
      } catch {
        attachmentResult = {
          error: new Error('Attachment upload failed.'),
        }
      }

      if (attachmentResult.error) {
        deliveryNotice =
          'Message sent, but the attachment could not be uploaded. Check the file type and size, then try again.'
      } else {
        try {
          const refreshedMessages = await getCommunityMessages(selectedRoom.id)
          if (refreshedMessages.error) {
            deliveryNotice =
              'Message sent, but the attachment could not be displayed yet. Refresh the room to try again.'
          } else {
            setMessages(refreshedMessages.data || [])
          }
        } catch {
          deliveryNotice =
            'Message sent, but the attachment could not be displayed yet. Refresh the room to try again.'
        }
      }
    }

    if (mentionedProfileIds.length > 0) {
      try {
        const notificationResult = await notifyCommunityMentions(data.id)
        if (notificationResult.error) {
          deliveryNotice = deliveryNotice
            ? `${deliveryNotice} The mention email could not be delivered.`
            : 'Message sent, but the mention email could not be delivered.'
        }
      } catch {
        deliveryNotice = deliveryNotice
          ? `${deliveryNotice} The mention email could not be delivered.`
          : 'Message sent, but the mention email could not be delivered.'
      }
    }

    setIsCreatingMessage(false)
    setChatNotice(deliveryNotice)
    setReplyingTo(null)
    return true
  }

  const handleDeleteMessage = async (message) => {
    if (!message.canDelete && message.profileId !== user?.id) return
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Remove this message from the room?')
    ) {
      return
    }

    const { error } = await deleteCommunityMessage(
      message.id,
      message.attachments,
    )
    if (error) {
      setChatError(getFriendlyCommunityChatError(error))
      return
    }
    if (replyingTo?.id === message.id) setReplyingTo(null)
    setMessages((current) => current.filter((item) => item.id !== message.id))
  }

  const statusMessage = chatError || communityError

  return (
    <>
      <main className="community-page pt-[84px]">
        <section id="rooms" className="community-page-section community-page-section-workspace scroll-mt-24">
          <div className="section-shell community-page-shell">
            <div className="community-page-topbar">
              <Link to="/" className="secondary-button community-back-link">
                <ArrowLeft size={17} aria-hidden="true" />
                Back to Homepage
              </Link>
              <p>Choose a room to join the conversation.</p>
            </div>

            <Reveal className="community-workspace">
              <header className="community-workspace-header">
                <div className="community-workspace-identity">
                  <span className="community-workspace-mark" aria-hidden="true">
                    <MessageSquareText size={22} strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="community-workspace-kicker">Community Hub</p>
                    <h1 className="community-workspace-title">Public room chat</h1>
                  </div>
                </div>
                <div className="community-user-pill">
                  <ProfileAvatar
                    path={profile?.avatar_path || profile?.avatarPath || ''}
                    name={displayName}
                    className="size-9 rounded-xl"
                    textClassName="text-xs"
                  />
                  <span className="community-user-copy">
                    <span className="community-user-name">
                      {user ? displayName : 'Guest reader'}
                    </span>
                    <span className="community-user-status">
                      {user ? (isApprovedMember ? 'Approved member' : 'Awaiting approval') : 'Read-only access'}
                    </span>
                  </span>
                </div>
              </header>

              <div className="community-workspace-toolbar">
                <div className="community-current-room">
                  <span className="community-current-room-icon" aria-hidden="true">#</span>
                  <span className="community-current-room-copy">
                    <span className="community-current-room-name">
                      {selectedRoom?.shortTitle || 'Community'}
                    </span>
                    <span className="community-current-room-description">
                      {selectedRoom?.isStaffOnly ? 'Staff notices' : 'Public room chat'}
                    </span>
                  </span>
                </div>
                <label className="community-search">
                  <Search size={16} aria-hidden="true" />
                  <span className="sr-only">Search messages in this room</span>
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={
                      canViewMessages
                        ? 'Search messages'
                        : 'Available after approval'
                    }
                    disabled={!canViewMessages}
                  />
                </label>
                <span className={`community-live-status ${isLiveChat ? 'community-live-status-active' : ''}`}>
                  <Radio size={14} aria-hidden="true" />
                  {isLiveChat
                    ? 'Live chat'
                    : canViewMessages
                      ? 'Preview chat'
                      : 'Members only'}
                </span>
              </div>

              {statusMessage && (
                <div className="community-notice" role="status">
                  <LockKeyhole size={18} className="shrink-0 text-orange-600" aria-hidden="true" />
                  <p>{statusMessage}</p>
                </div>
              )}

              <div className="community-workspace-body">
                <aside className="community-room-sidebar" aria-label="Community rooms">
                  <div className="community-sidebar-heading">
                    <div>
                      <p className="community-sidebar-kicker">Channels</p>
                      <p className="community-sidebar-count">
                        {isLoadingRooms ? 'Loading rooms...' : `${rooms.length} rooms`}
                      </p>
                    </div>
                    <Hash size={19} aria-hidden="true" />
                  </div>
                  <div className="community-room-list">
                    {rooms.map((room) => (
                      <RoomButton
                        key={room.id}
                        room={room}
                        active={room.id === selectedRoom?.id}
                        onClick={() => handleSelectRoom(room.id)}
                      />
                    ))}
                  </div>
                  <div className="community-sidebar-footer">
                    <CheckCircle2 size={16} aria-hidden="true" />
                    <p>
                      <strong>Approved members only</strong>
                      Approved accounts can read and send room messages.
                    </p>
                  </div>
                </aside>

                <section className="community-chat-panel" aria-labelledby="community-chat-title">
                  <header className="community-chat-header">
                    <div className="community-chat-room-heading">
                      <span className="community-chat-hash" aria-hidden="true">#</span>
                      <div className="min-w-0">
                        <h2 id="community-chat-title">
                          {selectedRoom?.title || 'Community room'}
                        </h2>
                        <p>{selectedRoom?.description}</p>
                      </div>
                    </div>
                    <div className="community-chat-header-actions">
                      {selectedRoom?.isStaffOnly && (
                        <span className="community-staff-badge">
                          <LockKeyhole size={12} aria-hidden="true" />
                          Staff only
                        </span>
                      )}
                      <button
                        type="button"
                        className="community-room-info-toggle"
                        aria-controls="community-room-info"
                        aria-expanded={isRoomInfoOpen}
                        onClick={() => setIsRoomInfoOpen((current) => !current)}
                      >
                        <Info size={14} aria-hidden="true" />
                        Details
                      </button>
                    </div>
                  </header>

                  <div
                    ref={messageListRef}
                    className="community-message-list"
                    aria-live="polite"
                  >
                    {!canViewMessages ? (
                      <CommunityMessageAccess
                        room={selectedRoom}
                        user={user}
                      />
                    ) : isLoadingMessages ? (
                      <div className="community-loading">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="community-chat-empty">
                        <span className="community-chat-empty-icon">
                          <MessageCircle size={24} aria-hidden="true" />
                        </span>
                        <p>No messages in this room yet.</p>
                        <span>Start the public conversation below.</span>
                      </div>
                    ) : visibleMessages.length === 0 ? (
                      <div className="community-chat-empty">
                        <span className="community-chat-empty-icon">
                          <Search size={24} aria-hidden="true" />
                        </span>
                        <p>No matching messages</p>
                        <span>Try another word or clear the search.</span>
                      </div>
                    ) : (
                      visibleMessages.map((message) => (
                        <MessageItem
                          key={message.id}
                          canReply={canSend && isLiveChat}
                          currentUserId={user?.id}
                          message={message}
                          mentionMembers={members}
                          onDelete={handleDeleteMessage}
                          onReply={setReplyingTo}
                          shouldReduceMotion={shouldReduceMotion}
                        />
                      ))
                    )}
                  </div>

                  <div className="community-chat-footer">
                    {canSend ? (
                      <MessageComposer
                        key={selectedRoom?.id}
                        currentUserId={user?.id}
                        error={chatError || chatNotice}
                        isSubmitting={isCreatingMessage}
                        mentionMembers={members}
                        onCancelReply={() => setReplyingTo(null)}
                        onSubmit={handleCreateMessage}
                        replyingTo={replyingTo}
                      />
                    ) : (
                      <div className="community-chat-access-note" role="status">
                        <LockKeyhole size={17} aria-hidden="true" />
                        <p>
                          {selectedRoom?.isStaffOnly
                            ? 'This room is reserved for officers, editors, and administrators.'
                            : user
                              ? 'Your account is pending approval. Messages and posting will unlock after an administrator approves it.'
                              : 'Sign in with an approved account to view and send messages.'}
                        </p>
                        {!user && (
                          <Link
                            to="/account?mode=login&redirect=%2Fcommunity"
                            className="community-access-link"
                          >
                            Sign in
                            <ArrowRight size={13} aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                <CommunityRoomInfo
                  canSend={canSend}
                  canViewMessages={canViewMessages}
                  className={isRoomInfoOpen ? 'community-room-info-open' : ''}
                  room={selectedRoom}
                />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  )
}

export default Community
