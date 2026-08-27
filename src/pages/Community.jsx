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
  disabled,
  error,
  isSubmitting,
  onCancelReply,
  onSubmit,
  replyingTo,
}) {
  const [body, setBody] = useState('')
  const inputRef = useRef(null)
  const canSubmit = Boolean(body.trim()) && !disabled && !isSubmitting

  useEffect(() => {
    if (replyingTo) inputRef.current?.focus()
  }, [replyingTo])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return

    const didSubmit = await onSubmit(body, replyingTo?.id || null)
    if (didSubmit) {
      setBody('')
      onCancelReply?.()
    }
  }

  const handleKeyDown = (event) => {
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
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={maxCommunityMessageLength}
          rows="1"
          placeholder={replyingTo ? 'Write your reply...' : 'Message this room...'}
          disabled={disabled || isSubmitting}
          className="community-input community-chat-input resize-none"
        />
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

function MessageItem({
  canReply,
  currentUserId,
  message,
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
              <p>{message.replyTo.body}</p>
            </div>
          )}
          <p>{message.body}</p>
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

function CommunityRoomInfo({ canSend, room }) {
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
          <dd>Public room</dd>
        </div>
        <div>
          <dt><Radio size={14} aria-hidden="true" /> Posting</dt>
          <dd>{canSend ? 'You can send messages' : 'Approved members only'}</dd>
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
  const [searchTerm, setSearchTerm] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const messageListRef = useRef(null)

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) || rooms[0],
    [rooms, selectedRoomId],
  )
  const displayName = getDisplayName(profile, user, 'member')
  const canSend =
    isApprovedMember &&
    Boolean(selectedRoom) &&
    (!selectedRoom.isStaffOnly || canAccessAdmin)
  const isLoadingMessages = Boolean(
    selectedRoom?.id && loadedMessagesRoomId !== selectedRoom.id,
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
  const isLiveChat = isConfigured && !chatError && !communityError

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
    let isMounted = true

    getCommunityMessages(selectedRoom.id)
      .then(({ data, error }) => {
        if (!isMounted) return
        setMessages(error ? getStarterMessages(selectedRoom.id) : data || [])
        setChatError(error ? getFriendlyCommunityChatError(error) : '')
        setLoadedMessagesRoomId(selectedRoom.id)
      })
      .catch((error) => {
        if (!isMounted) return
        setMessages(getStarterMessages(selectedRoom.id))
        setChatError(getFriendlyCommunityChatError(error))
        setLoadedMessagesRoomId(selectedRoom.id)
      })

    return () => {
      isMounted = false
    }
  }, [selectedRoom?.id])

  useEffect(() => {
    if (!isConfigured || !user || !selectedRoom?.id || chatError) return undefined
    let isMounted = true

    const refreshMessages = async () => {
      const { data, error } = await getCommunityMessages(selectedRoom.id)
      if (!isMounted) return
      if (error) {
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
  }, [chatError, isConfigured, selectedRoom?.id, user])

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
                    placeholder="Search messages"
                  />
                </label>
                <span className={`community-live-status ${isLiveChat ? 'community-live-status-active' : ''}`}>
                  <Radio size={14} aria-hidden="true" />
                  {isLiveChat ? 'Live chat' : 'Preview chat'}
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
                      <strong>Public by design</strong>
                      Everyone can read. Approved members can send.
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
                    {isLoadingMessages ? (
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
                        error={chatError}
                        isSubmitting={isCreatingMessage}
                        onCancelReply={() => setReplyingTo(null)}
                        onSubmit={handleCreateMessage}
                        replyingTo={replyingTo}
                      />
                    ) : (
                      <div className="community-chat-access-note">
                        <LockKeyhole size={17} aria-hidden="true" />
                        <p>
                          {selectedRoom?.isStaffOnly
                            ? 'This room is reserved for officers, editors, and administrators.'
                            : user
                              ? 'Your account can send messages after an administrator approves it.'
                              : 'Sign in with an approved account to send a message.'}
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

                <CommunityRoomInfo canSend={canSend} room={selectedRoom} />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  )
}

export default Community
