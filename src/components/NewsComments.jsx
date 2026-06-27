import {
  ChevronDown,
  Heart,
  MessageCircle,
  Reply,
  Send,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../context/useAuth'
import {
  createNewsComment,
  deleteNewsComment,
  getFriendlyCommentError,
  getNewsComments,
  maxNewsCommentLength,
} from '../lib/media'
import ProfileAvatar from './ProfileAvatar'

function pluralizeComment(count) {
  return `${count} ${count === 1 ? 'comment' : 'comments'}`
}

function CommentComposer({
  autoFocus = false,
  disabled = false,
  error = '',
  isSubmitting = false,
  isReply = false,
  onCancel,
  onSubmit,
  placeholder = 'Write a comment...',
}) {
  const [body, setBody] = useState('')
  const remaining = maxNewsCommentLength - body.length
  const canSubmit = body.trim().length > 0 && remaining >= 0 && !isSubmitting

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return

    const nextBody = body.trim()
    const didSubmit = await onSubmit(nextBody)
    if (didSubmit) setBody('')
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-2">
      <div className="relative">
        <textarea
          value={body}
          autoFocus={autoFocus}
          disabled={disabled || isSubmitting}
          onChange={(event) => setBody(event.target.value)}
          maxLength={maxNewsCommentLength + 1}
          rows={isReply ? 2 : 3}
          placeholder={placeholder}
          className={`w-full resize-none rounded-[1.35rem] border border-white/10 bg-white/[0.08] px-4 py-3 pr-14 text-sm font-semibold text-white outline-none transition placeholder:text-blue-100/45 focus:border-brand-300 focus:bg-white/[0.12] focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:bg-white/[0.05] disabled:text-blue-100/40 ${
            isReply ? 'min-h-16' : 'min-h-20'
          }`}
        />
        <button
          type="submit"
          disabled={!canSubmit || disabled}
          className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-blue-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          aria-label={isSubmitting ? 'Posting comment' : 'Post comment'}
        >
          <Send size={15} aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`text-[11px] font-bold ${
              remaining < 0 ? 'text-red-600' : 'text-slate-400'
            }`}
          >
            {remaining} left
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-3 py-1 text-xs font-extrabold text-blue-100/65 transition hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>
        {isSubmitting && (
          <span className="text-[11px] font-extrabold text-brand-600">
            Posting...
          </span>
        )}
      </div>
      {error && (
        <p className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-100">
          {error}
        </p>
      )}
    </form>
  )
}

function CommentItem({
  comment,
  currentUserId,
  isReply = false,
  onDelete,
  onReply,
  replies = [],
}) {
  const isCurrentUser = comment.profileId === currentUserId

  return (
    <article className="relative">
      <div className="flex items-start gap-2.5">
        <ProfileAvatar
          path={comment.avatarPath}
          name={comment.fullName}
          className={
            isReply
              ? 'size-8 rounded-full ring-2 ring-navy-950'
              : 'size-9 rounded-full ring-2 ring-navy-950'
          }
          textClassName="text-xs"
        />
        <div className="min-w-0 flex-1">
          <div className="inline-block max-w-full rounded-[1.25rem] bg-white/[0.11] px-3.5 py-2.5 text-left ring-1 ring-white/10">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              <h3 className="truncate text-[13px] font-extrabold leading-4 text-white">
                {comment.fullName}
              </h3>
              {isCurrentUser && (
                <span className="rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-black leading-none text-blue-100">
                  You
                </span>
              )}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-[15px] leading-5 text-blue-50/90">
              {comment.body}
            </p>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 pl-3 text-[11px] font-extrabold text-blue-100/55">
            <span>{comment.date}</span>
            <button
              type="button"
              className="transition hover:text-white"
              aria-label="Like comment"
            >
              Like
            </button>
            {!isReply && (
              <button
                type="button"
                onClick={() => onReply(comment.id)}
                className="transition hover:text-white"
              >
                Reply
              </button>
            )}
            {comment.canDelete && (
              <button
                type="button"
                onClick={() => onDelete(comment)}
                className="inline-flex items-center gap-1 transition hover:text-red-200"
              >
                <Trash2 size={11} aria-hidden="true" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="relative ml-4 mt-2 space-y-2 border-l-2 border-white/10 pl-4 sm:ml-4">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              isReply
              onDelete={onDelete}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </article>
  )
}

function NewsComments({
  className = '',
  initialCommentTotal = 0,
  newsPostId,
  onCommentTotalChange,
}) {
  const { isApprovedMember, profile, user } = useAuth()
  const [comments, setComments] = useState([])
  const [commentTotal, setCommentTotal] = useState(Number(initialCommentTotal) || 0)
  const [activeReplyId, setActiveReplyId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingRoot, setIsSubmittingRoot] = useState(false)
  const [submittingReplyId, setSubmittingReplyId] = useState('')
  const [deletingCommentId, setDeletingCommentId] = useState('')
  const [loadError, setLoadError] = useState('')
  const [composerError, setComposerError] = useState('')
  const [replyError, setReplyError] = useState('')

  useEffect(() => {
    let isMounted = true

    getNewsComments(newsPostId).then(({ data, error }) => {
      if (!isMounted) return
      setComments(error ? [] : data)
      setLoadError(error ? getFriendlyCommentError(error) : '')
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [newsPostId])

  const repliesByParentId = useMemo(() => {
    const groups = new Map()

    comments.forEach((comment) => {
      if (!comment.parentCommentId) return
      const current = groups.get(comment.parentCommentId) || []
      current.push(comment)
      groups.set(comment.parentCommentId, current)
    })

    return groups
  }, [comments])

  const rootComments = useMemo(
    () => comments.filter((comment) => !comment.parentCommentId),
    [comments],
  )

  const updateTotal = (nextTotal) => {
    const safeTotal = Math.max(Number(nextTotal) || 0, 0)
    setCommentTotal(safeTotal)
    onCommentTotalChange?.(safeTotal)
  }

  const addCommentToList = (comment) => {
    if (!comment?.id) return
    setComments((current) =>
      comment.parentCommentId ? [...current, comment] : [comment, ...current],
    )
    setCommentTotal((current) => {
      const nextTotal = current + 1
      onCommentTotalChange?.(nextTotal)
      return nextTotal
    })
  }

  const handleCreateComment = async (body, parentCommentId = null) => {
    if (!isApprovedMember) return false

    if (parentCommentId) {
      setSubmittingReplyId(parentCommentId)
      setReplyError('')
    } else {
      setIsSubmittingRoot(true)
      setComposerError('')
    }

    const { data, error } = await createNewsComment(
      newsPostId,
      body,
      parentCommentId,
    )

    if (parentCommentId) setSubmittingReplyId('')
    else setIsSubmittingRoot(false)

    if (error) {
      const message = getFriendlyCommentError(error)
      if (parentCommentId) setReplyError(message)
      else setComposerError(message)
      return false
    }

    addCommentToList(data)
    setActiveReplyId('')
    return true
  }

  const handleDeleteComment = async (comment) => {
    if (!comment?.id || deletingCommentId) return

    setDeletingCommentId(comment.id)
    setLoadError('')

    const { data, error } = await deleteNewsComment(comment.id)
    setDeletingCommentId('')

    if (error) {
      setLoadError(getFriendlyCommentError(error))
      return
    }

    setComments((current) =>
      current.filter(
        (item) =>
          item.id !== comment.id && item.parentCommentId !== comment.id,
      ),
    )
    updateTotal(data)
  }

  return (
    <section id="comments" className={`scroll-mt-28 ${className}`}>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-navy-950 text-white shadow-[0_30px_80px_-44px_rgba(7,21,47,0.85)]">
        <div className="border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-extrabold text-blue-100/60">
            <div className="flex items-center gap-5">
              <span className="inline-flex items-center gap-1.5">
                <ThumbsUp size={16} aria-hidden="true" />
                Reactions
              </span>
              <span className="inline-flex items-center gap-1.5 text-blue-100">
                <MessageCircle size={16} aria-hidden="true" />
                {pluralizeComment(commentTotal)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Reply size={16} aria-hidden="true" />
                Reply
              </span>
            </div>
            <span className="flex -space-x-1.5">
              <span className="grid size-5 place-items-center rounded-full border-2 border-navy-950 bg-brand-600 text-white">
                <ThumbsUp size={10} aria-hidden="true" />
              </span>
              <span className="grid size-5 place-items-center rounded-full border-2 border-navy-950 bg-rose-500 text-white">
                <Heart size={10} fill="currentColor" aria-hidden="true" />
              </span>
            </span>
          </div>
        </div>

        <div className="px-4 py-3 sm:px-5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-extrabold text-blue-100/65 transition hover:text-white"
          >
            Most relevant
            <ChevronDown size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="px-4 pb-4 sm:px-5">
          {isLoading ? (
            <p className="rounded-2xl bg-white/[0.08] p-4 text-sm font-bold text-blue-100/70">
              Loading comments...
            </p>
          ) : loadError ? (
            <p className="rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-sm font-bold text-red-100">
              {loadError}
            </p>
          ) : rootComments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.06] p-6 text-center">
              <MessageCircle
                size={28}
                className="mx-auto text-blue-200"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-bold text-blue-100/75">
                No comments yet. Be the first to start the conversation.
              </p>
            </div>
          ) : (
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {rootComments.map((comment) => (
                <div key={comment.id} className="grid gap-2">
                  <CommentItem
                    comment={comment}
                    currentUserId={user?.id}
                    onDelete={handleDeleteComment}
                    onReply={(commentId) =>
                      setActiveReplyId((current) =>
                        current === commentId ? '' : commentId,
                      )
                    }
                    replies={repliesByParentId.get(comment.id) || []}
                  />

                  {activeReplyId === comment.id && (
                    <div className="ml-11 rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
                      {user && isApprovedMember ? (
                        <CommentComposer
                          autoFocus
                          error={replyError}
                          isReply
                          isSubmitting={submittingReplyId === comment.id}
                          onCancel={() => {
                            setActiveReplyId('')
                            setReplyError('')
                          }}
                          onSubmit={(body) =>
                            handleCreateComment(body, comment.id)
                          }
                          placeholder={`Reply to ${comment.fullName}...`}
                        />
                      ) : (
                        <p className="text-sm font-bold text-blue-100/75">
                          Approved accounts can reply to comments.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-navy-950/95 px-4 py-4 sm:px-5">
          {user && isApprovedMember ? (
            <div className="flex items-start gap-3">
              <ProfileAvatar
                path={profile?.avatar_path}
                name={profile?.nickname || profile?.full_name || user.email}
                className="size-9 rounded-full ring-2 ring-navy-950"
                textClassName="text-xs"
              />
              <div className="min-w-0 flex-1">
                <CommentComposer
                  disabled={isSubmittingRoot}
                  error={composerError}
                  isSubmitting={isSubmittingRoot}
                  onSubmit={(body) => handleCreateComment(body)}
                  placeholder={`Comment as ${
                    profile?.nickname ||
                    profile?.full_name ||
                    user.email?.split('@')[0] ||
                    'you'
                  }`}
                />
              </div>
            </div>
          ) : user ? (
            <p className="rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-100">
              Your account needs approval before you can comment.
            </p>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm font-bold text-blue-100/75">
              <Link to="/account" className="text-blue-100 underline">
                Sign in
              </Link>{' '}
              with an approved account to join the comments.
            </p>
          )}
        </div>

        {deletingCommentId && (
          <p className="border-t border-white/10 px-5 py-3 text-xs font-bold text-blue-100/50">
            Removing comment...
          </p>
        )}
      </div>
    </section>
  )
}

export default NewsComments
