import { motion as Motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Hash,
  Info,
  LockKeyhole,
  MessageCircle,
  MessageSquareText,
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
  getCommunityMembers,
  getCommunityMessages,
  getFriendlyCommunityChatError,
  getStarterMessages,
  maxCommunityMessageLength,
  subscribeToCommunityMessages,
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
  const [mention, setMention] = useState(null)
  const [activeMentionIndex, setActiveMentionIndex] = useState(0)
  const inputRef = useRef(null)
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return

    const didSubmit = await onSubmit(body, replyingTo?.id || null)
    if (didSubmit) {
      setBody('')
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
      <div className="community-chat-composer-meta">
        <span>Enter to send. Shift + Enter for a new line.</span>
        <span>{maxCommunityMessageLength - body.length}</span>
      </div>
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

function CommunityRoomInfo({ canSend, canViewMessages, room }) {
  return (
    <aside className="community-room-info" aria-label="Room information">
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
  const [selectedRoomId, setSelectedRoomId] = useState(communityRooms[0]?.id || '')
  const [messages, setMessages] = useState(
    getStarterMessages(communityRooms[0]?.id || ''),
  )
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [loadedMessagesRoomId, setLoadedMessagesRoomId] = useState('')
  const [isCreatingMessage, setIsCreatingMessage] = useState(false)
  const [communityError, setCommunityError] = useState('')
  const [chatError, setChatError] = useState('')
  const [members, setMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
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
    setSearchTerm('')
    setReplyingTo(null)
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

  const handleCreateMessage = async (body, replyToMessageId) => {
    if (!canSend || !selectedRoom?.id) return false
    setChatError('')
    setIsCreatingMessage(true)

    let result
    try {
      result = await createCommunityMessage(
        selectedRoom.id,
        body,
        replyToMessageId,
      )
    } catch (error) {
      setIsCreatingMessage(false)
      setChatError(getFriendlyCommunityChatError(error))
      return false
    }

    setIsCreatingMessage(false)
    const { data, error } = result

    if (error || !data) {
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

    const { error } = await deleteCommunityMessage(message.id)
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
      <main className="pt-[84px]">
        <section id="rooms" className="community-page-section scroll-mt-24 py-10 sm:py-14">
          <div className="section-shell">
            <Link to="/" className="secondary-button mb-5">
              <ArrowLeft size={17} aria-hidden="true" />
              Back to Homepage
            </Link>

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
                    {selectedRoom?.isStaffOnly && (
                      <span className="community-staff-badge">
                        <LockKeyhole size={12} aria-hidden="true" />
                        Staff only
                      </span>
                    )}
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
                        error={chatError}
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
