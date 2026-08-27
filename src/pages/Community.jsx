import { motion as Motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  LockKeyhole,
  MessageCircle,
  MessageSquareText,
  Pin,
  Plus,
  Send,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import ProfileAvatar from '../components/ProfileAvatar'
import Reveal from '../components/Reveal'
import useAuth from '../context/useAuth'
import { communityRooms } from '../data/community'
import { useMotionPreferences } from '../hooks/useMotionPreferences'
import {
  createCommunityComment,
  createCommunityPost,
  getCommunityComments,
  getCommunityPosts,
  getCommunityRooms,
  getFriendlyCommunityError,
  getStarterComments,
  getStarterPosts,
  maxCommunityCommentLength,
  maxCommunityPostBodyLength,
  maxCommunityPostTitleLength,
} from '../lib/community'
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

function PostComposer({ disabled, error, isSubmitting, onSubmit }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const canSubmit =
    title.trim() && body.trim() && !isSubmitting && !disabled

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return

    const didSubmit = await onSubmit({ title, body })
    if (didSubmit) {
      setTitle('')
      setBody('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="community-composer mt-5">
      <div className="flex items-center gap-2">
        <Plus size={16} className="text-brand-600" aria-hidden="true" />
        <p className="text-sm font-extrabold text-navy-900">Start a discussion</p>
      </div>
      <div className="mt-3 grid gap-3">
        <label className="sr-only" htmlFor="community-post-title">
          Discussion title
        </label>
        <input
          id="community-post-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={maxCommunityPostTitleLength}
          placeholder="What would you like to discuss?"
          disabled={disabled || isSubmitting}
          className="community-input"
        />
        <label className="sr-only" htmlFor="community-post-body">
          Discussion details
        </label>
        <textarea
          id="community-post-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={maxCommunityPostBodyLength}
          rows="3"
          placeholder="Add a little context for other members..."
          disabled={disabled || isSubmitting}
          className="community-input resize-none"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-bold text-slate-500">
          Keep posts respectful and useful to the community.
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-extrabold text-white shadow-[0_12px_28px_-16px_rgba(21,94,239,0.85)] transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isSubmitting ? 'Posting...' : 'Post discussion'}
          <Send size={14} aria-hidden="true" />
        </button>
      </div>
      {error && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
          {error}
        </p>
      )}
    </form>
  )
}

function CommentComposer({ disabled, error, isSubmitting, onSubmit }) {
  const [body, setBody] = useState('')
  const canSubmit = body.trim() && !disabled && !isSubmitting

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return

    const didSubmit = await onSubmit(body)
    if (didSubmit) setBody('')
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 border-t border-slate-200 pt-5">
      <label className="sr-only" htmlFor="community-comment-body">
        Reply to this discussion
      </label>
      <div className="relative">
        <textarea
          id="community-comment-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={maxCommunityCommentLength}
          rows="3"
          placeholder="Add a reply..."
          disabled={disabled || isSubmitting}
          className="community-input resize-none pr-14"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          aria-label="Post reply"
        >
          <Send size={15} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-bold text-slate-500">
        <span>{maxCommunityCommentLength - body.length} characters left</span>
        {isSubmitting && <span className="text-brand-600">Posting...</span>}
      </div>
      {error && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
          {error}
        </p>
      )}
    </form>
  )
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
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
        <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block truncate text-xs font-extrabold text-navy-900">
          {room.title}
        </span>
        <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-500">
          {room.isStaffOnly ? 'Staff notices' : room.description}
        </span>
      </span>
    </button>
  )
}

function PostCard({ active, onClick, post }) {
  return (
    <Motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      whileHover={{ y: -2 }}
      className={`community-post-card w-full text-left ${active ? 'community-post-card-active' : ''}`}
    >
      <div className="flex items-start gap-3">
        <ProfileAvatar
          path={post.avatarPath}
          name={post.authorName}
          className="size-10 rounded-xl"
          textClassName="text-xs"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-xs font-extrabold text-navy-900">
              {post.authorName}
            </p>
            <span className="text-[10px] font-bold text-slate-400">
              {roleLabel(post.authorRole)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {post.isPinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-orange-600">
                <Pin size={11} aria-hidden="true" />
                Pinned
              </span>
            )}
            <span className="text-[10px] font-bold text-slate-400">
              {post.date || 'Recently'}
            </span>
          </div>
        </div>
      </div>
      <h3 className="mt-4 text-base font-black tracking-tight text-navy-900">
        {post.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
        {post.body}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3 text-[11px] font-extrabold text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle size={14} aria-hidden="true" />
          {post.commentCount} {post.commentCount === 1 ? 'reply' : 'replies'}
        </span>
        <span className="inline-flex items-center gap-1 text-brand-600">
          Open thread
          <ArrowRight size={13} aria-hidden="true" />
        </span>
      </div>
    </Motion.button>
  )
}

function CommentItem({ comment }) {
  return (
    <article className="flex items-start gap-3">
      <ProfileAvatar
        path={comment.avatarPath}
        name={comment.fullName}
        className="size-8 rounded-full"
        textClassName="text-[10px]"
      />
      <div className="min-w-0 flex-1">
        <div className="community-comment-bubble">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-extrabold text-navy-900">
              {comment.fullName}
            </p>
            <span className="text-[10px] font-bold text-slate-400">
              {comment.date || 'Recently'}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {comment.body}
          </p>
        </div>
      </div>
    </article>
  )
}

function Community() {
  const { user, profile, isApprovedMember, canAccessAdmin, isConfigured } = useAuth()
  const { shouldReduceMotion } = useMotionPreferences()
  const [rooms, setRooms] = useState(communityRooms)
  const [selectedRoomId, setSelectedRoomId] = useState(communityRooms[0].id)
  const [posts, setPosts] = useState(getStarterPosts(communityRooms[0].id))
  const [selectedPostId, setSelectedPostId] = useState(
    getStarterPosts(communityRooms[0].id)[0]?.id || '',
  )
  const [comments, setComments] = useState(
    getStarterComments(getStarterPosts(communityRooms[0].id)[0]?.id),
  )
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [loadedPostsRoomId, setLoadedPostsRoomId] = useState('')
  const [loadedCommentsPostId, setLoadedCommentsPostId] = useState('')
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [isCreatingComment, setIsCreatingComment] = useState(false)
  const [communityError, setCommunityError] = useState('')
  const [postError, setPostError] = useState('')
  const [commentError, setCommentError] = useState('')

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) || rooms[0],
    [rooms, selectedRoomId],
  )
  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) || posts[0],
    [posts, selectedPostId],
  )
  const displayName = getDisplayName(profile, user, 'member')
  const canPost =
    isApprovedMember &&
    Boolean(selectedRoom) &&
    (!selectedRoom.isStaffOnly || canAccessAdmin)
  const isLoadingPosts = Boolean(
    selectedRoom?.id && loadedPostsRoomId !== selectedRoom.id,
  )
  const isLoadingComments = Boolean(
    selectedPost?.id && loadedCommentsPostId !== selectedPost.id,
  )

  const handleSelectRoom = (roomId) => {
    if (roomId === selectedRoomId) return
    setSelectedRoomId(roomId)
    setPosts([])
    setSelectedPostId('')
    setComments([])
    setPostError('')
    setCommentError('')
  }

  const handleSelectPost = (postId) => {
    if (postId === selectedPostId) return
    setSelectedPostId(postId)
    setComments([])
    setCommentError('')
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

    getCommunityPosts(selectedRoom.id)
      .then(({ data, error }) => {
        if (!isMounted) return
        const nextPosts = error ? getStarterPosts(selectedRoom.id) : data || []
        setPosts(nextPosts)
        setSelectedPostId((current) =>
          nextPosts.some((post) => post.id === current)
            ? current
            : nextPosts[0]?.id || '',
        )
        if (error) setCommunityError(getFriendlyCommunityError(error))
        setLoadedPostsRoomId(selectedRoom.id)
      })
      .catch((error) => {
        if (!isMounted) return
        const nextPosts = getStarterPosts(selectedRoom.id)
        setPosts(nextPosts)
        setSelectedPostId(nextPosts[0]?.id || '')
        setCommunityError(getFriendlyCommunityError(error))
        setLoadedPostsRoomId(selectedRoom.id)
      })

    return () => {
      isMounted = false
    }
  }, [selectedRoom?.id])

  useEffect(() => {
    if (!selectedPost?.id) {
      return undefined
    }

    let isMounted = true
    getCommunityComments(selectedPost.id)
      .then(({ data, error }) => {
        if (!isMounted) return
        setComments(error ? getStarterComments(selectedPost.id) : data || [])
        if (error) setCommunityError(getFriendlyCommunityError(error))
        setLoadedCommentsPostId(selectedPost.id)
      })
      .catch((error) => {
        if (!isMounted) return
        setComments(getStarterComments(selectedPost.id))
        setCommunityError(getFriendlyCommunityError(error))
        setLoadedCommentsPostId(selectedPost.id)
      })

    return () => {
      isMounted = false
    }
  }, [selectedPost?.id])

  const handleCreatePost = async ({ title, body }) => {
    if (!canPost) return false
    setPostError('')
    setIsCreatingPost(true)
    let result
    try {
      result = await createCommunityPost(selectedRoom.id, { title, body })
    } catch (error) {
      setIsCreatingPost(false)
      setPostError(getFriendlyCommunityError(error))
      return false
    }
    const { data, error } = result
    setIsCreatingPost(false)

    if (error || !data) {
      setPostError(
        error
          ? getFriendlyCommunityError(error)
          : 'The discussion could not be posted.',
      )
      return false
    }

    const nextPost = {
      ...data,
      roomId: selectedRoom.id,
      authorName: data.authorName || displayName,
      authorRole: data.authorRole || profile?.role || 'student',
    }
    setPosts((current) => [nextPost, ...current])
    setSelectedPostId(nextPost.id)
    return true
  }

  const handleCreateComment = async (body) => {
    if (!isApprovedMember || !selectedPost?.id) return false
    setCommentError('')
    setIsCreatingComment(true)
    let result
    try {
      result = await createCommunityComment(selectedPost.id, body)
    } catch (error) {
      setIsCreatingComment(false)
      setCommentError(getFriendlyCommunityError(error))
      return false
    }
    const { data, error } = result
    setIsCreatingComment(false)

    if (error || !data) {
      setCommentError(
        error ? getFriendlyCommunityError(error) : 'The reply could not be posted.',
      )
      return false
    }

    setComments((current) => [...current, data])
    setPosts((current) =>
      current.map((post) =>
        post.id === selectedPost.id
          ? { ...post, commentCount: post.commentCount + 1 }
          : post,
      ),
    )
    return true
  }

  return (
    <>
      <main className="pt-[84px]">
        <PageHero
          eyebrow="Public member rooms"
          title="Community Hub"
          description="Join topic-based rooms for questions, event discussions, resource requests, and verified organization notices."
          actions={
            <>
              <a href="#rooms" className="primary-button">
                <MessageCircle size={18} aria-hidden="true" />
                Browse rooms
              </a>
              <Link to="/account" className="secondary-button">
                <ShieldCheck size={18} aria-hidden="true" />
                Account access
              </Link>
            </>
          }
        />

        <section id="rooms" className="community-page-section scroll-mt-24 py-14 sm:py-20">
          <div className="section-shell">
            <Reveal className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Organized conversations</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                  Choose a room and join the thread
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Posts stay grouped by topic so useful questions and official
                  answers are easier to find later.
                </p>
              </div>
              <div className="community-member-chip">
                <span className="grid size-8 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <UsersRound size={15} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[10px] font-black tracking-[0.14em] text-brand-600 uppercase">
                    Your access
                  </span>
                  <span className="mt-0.5 block text-xs font-extrabold text-navy-900">
                    {user ? (isApprovedMember ? displayName : 'Awaiting approval') : 'Guest reader'}
                  </span>
                </span>
              </div>
            </Reveal>

            {communityError && (
              <div className="community-notice mb-6" role="status">
                <LockKeyhole size={18} className="shrink-0 text-orange-600" aria-hidden="true" />
                <p>{communityError}</p>
              </div>
            )}

            <div className="grid items-start gap-5 lg:grid-cols-[17rem_minmax(0,1fr)_22rem]">
              <Reveal className="community-panel p-3 sm:p-4" delay={0.04}>
                <div className="flex items-center justify-between gap-3 px-2 pb-3">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.16em] text-brand-600 uppercase">
                      Rooms
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {isLoadingRooms ? 'Loading rooms...' : `${rooms.length} spaces`}
                    </p>
                  </div>
                  <MessageCircle size={18} className="text-brand-600" aria-hidden="true" />
                </div>
                <div className="grid gap-1.5">
                  {rooms.map((room) => (
                    <RoomButton
                      key={room.id}
                      room={room}
                      active={room.id === selectedRoom?.id}
                      onClick={() => handleSelectRoom(room.id)}
                    />
                  ))}
                </div>
                <div className="community-side-note mt-4">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-600" aria-hidden="true" />
                  <p>Members can post after account approval. Everyone can read public discussions.</p>
                </div>
              </Reveal>

              <Reveal className="community-panel p-5 sm:p-6" delay={0.08}>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black tracking-[0.16em] text-brand-600 uppercase">
                      {selectedRoom?.shortTitle || 'Community'} room
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-navy-900">
                      {selectedRoom?.title || 'Community room'}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                      {selectedRoom?.description}
                    </p>
                  </div>
                  {selectedRoom?.isStaffOnly && (
                    <span className="community-staff-badge inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold">
                      <LockKeyhole size={13} aria-hidden="true" />
                      Staff posting
                    </span>
                  )}
                </div>

                {canPost ? (
                  <PostComposer
                    error={postError}
                    isSubmitting={isCreatingPost}
                    onSubmit={handleCreatePost}
                  />
                ) : (
                  <div className="community-access-note mt-5">
                    <LockKeyhole size={18} className="shrink-0 text-brand-600" aria-hidden="true" />
                    <p>
                      {selectedRoom?.isStaffOnly
                        ? 'This room is for officers, editors, and administrators. Members can still read the notices.'
                        : user
                          ? 'Your account can join discussions once an administrator approves it.'
                          : 'Sign in with an approved account to start a discussion.'}
                    </p>
                    {!user && (
                      <Link
                        to="/account?mode=login&redirect=%2Fcommunity"
                        className="shrink-0 text-xs font-extrabold text-brand-600 hover:text-brand-700"
                      >
                        Sign in
                      </Link>
                    )}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black tracking-[0.14em] text-navy-900 uppercase">
                      Latest discussions
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {posts.length} {posts.length === 1 ? 'conversation' : 'conversations'}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400">
                    {isConfigured && !communityError ? 'Live room' : 'Preview content'}
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  {isLoadingPosts ? (
                    <div className="community-loading">Loading discussions...</div>
                  ) : posts.length === 0 ? (
                    <div className="community-empty">
                      <MessageCircle size={25} className="mx-auto text-brand-600" aria-hidden="true" />
                      <p className="mt-3 text-sm font-extrabold text-navy-900">
                        No discussions in this room yet.
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Approved members can start the first conversation.
                      </p>
                    </div>
                  ) : (
                    posts.map((post, index) => (
                      <Motion.div
                        key={post.id}
                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: shouldReduceMotion ? 0.01 : 0.25, delay: index * 0.035 }}
                      >
                        <PostCard
                          post={post}
                          active={post.id === selectedPost?.id}
                          onClick={() => handleSelectPost(post.id)}
                        />
                      </Motion.div>
                    ))
                  )}
                </div>
              </Reveal>

              <Reveal className="community-panel p-5 sm:p-6" delay={0.12}>
                {selectedPost ? (
                  <>
                    <div className="flex items-start gap-3">
                      <ProfileAvatar
                        path={selectedPost.avatarPath}
                        name={selectedPost.authorName}
                        className="size-10 rounded-xl"
                        textClassName="text-xs"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black tracking-[0.16em] text-brand-600 uppercase">
                          Discussion thread
                        </p>
                        <p className="mt-1 text-xs font-extrabold text-navy-900">
                          {selectedPost.authorName}
                        </p>
                        <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                          {selectedPost.date || 'Recently'}
                        </p>
                      </div>
                    </div>
                    <h2 className="mt-5 text-xl font-black tracking-tight text-navy-900">
                      {selectedPost.title}
                    </h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                      {selectedPost.body}
                    </p>

                    <div className="mt-6 flex items-center justify-between gap-3 border-y border-slate-200 py-3">
                      <p className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500">
                        <MessageCircle size={15} aria-hidden="true" />
                        {comments.length} {comments.length === 1 ? 'reply' : 'replies'}
                      </p>
                      {selectedPost.isPinned && (
                        <p className="inline-flex items-center gap-1 text-[10px] font-extrabold text-orange-600">
                          <Pin size={12} aria-hidden="true" />
                          Pinned
                        </p>
                      )}
                    </div>

                    <div className="mt-5 space-y-4">
                      {isLoadingComments ? (
                        <div className="community-loading">Loading replies...</div>
                      ) : comments.length === 0 ? (
                        <div className="community-empty py-7">
                          <MessageCircle size={23} className="mx-auto text-brand-600" aria-hidden="true" />
                          <p className="mt-2 text-xs font-extrabold text-navy-900">
                            No replies yet.
                          </p>
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <CommentItem key={comment.id} comment={comment} />
                        ))
                      )}
                    </div>

                    {isApprovedMember ? (
                      <CommentComposer
                        error={commentError}
                        isSubmitting={isCreatingComment}
                        onSubmit={handleCreateComment}
                      />
                    ) : (
                      <div className="community-reply-note mt-5">
                        <p>
                          {user
                            ? 'Account approval is required before you can reply.'
                            : 'Sign in with an approved account to reply.'}
                        </p>
                        {!user && (
                          <Link
                            to="/account?mode=login&redirect=%2Fcommunity"
                            className="inline-flex items-center gap-1 text-xs font-extrabold text-brand-600"
                          >
                            Sign in
                            <ArrowRight size={13} aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="community-empty min-h-72">
                    <MessageSquareText size={28} className="mx-auto text-brand-600" aria-hidden="true" />
                    <p className="mt-3 text-sm font-extrabold text-navy-900">
                      Select a discussion
                    </p>
                    <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                      Open a post to read the full conversation and add a reply.
                    </p>
                  </div>
                )}
              </Reveal>
            </div>
          </div>
        </section>

        <section className="bg-navy-950 py-16 sm:py-20">
          <div className="section-shell">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-extrabold tracking-[0.2em] text-blue-300 uppercase">
                Community guidelines
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Keep the hub useful for everyone
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                Use the room that matches your topic, share accurate information,
                and keep personal or sensitive details out of public discussions.
              </p>
            </Reveal>
            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {[
                ['Post with context', 'Clear titles help classmates find answers later.', MessageSquareText],
                ['Keep it respectful', 'Disagree with ideas without targeting people.', UsersRound],
                ['Use official pages', 'Check announcements and events for verified details.', ShieldCheck],
              ].map(([title, description, Icon], index) => (
                <Reveal key={title} delay={index * 0.06}>
                  <article className="community-guideline-card h-full">
                    <span className="grid size-10 place-items-center rounded-xl bg-blue-400/10 text-blue-200">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-sm font-extrabold text-white">{title}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default Community
