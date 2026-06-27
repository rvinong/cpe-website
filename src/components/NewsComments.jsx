import { MessageCircle, Reply, Send, Trash2 } from 'lucide-react'
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
      <textarea
        value={body}
        autoFocus={autoFocus}
        disabled={disabled || isSubmitting}
        onChange={(event) => setBody(event.target.value)}
        maxLength={maxNewsCommentLength + 1}
        rows={3}
        placeholder={placeholder}
        className="min-h-24 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={`text-xs font-bold ${
            remaining < 0 ? 'text-red-600' : 'text-slate-400'
          }`}
        >
          {remaining} characters left
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-4 py-2 text-xs font-extrabold text-slate-500 transition hover:bg-slate-100 hover:text-navy-900"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!canSubmit || disabled}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <Send size={14} aria-hidden="true" />
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
      {error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
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
    <article
      className={`rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 ${
        isReply ? 'rounded-2xl bg-slate-50/70 p-3 shadow-none' : ''
      }`}
    >
      <div className="flex gap-3">
        <ProfileAvatar
          path={comment.avatarPath}
          name={comment.fullName}
          className={isReply ? 'size-9 rounded-full' : 'size-11 rounded-full'}
          textClassName="text-xs"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="truncate text-sm font-extrabold text-navy-900">
              {comment.fullName}
            </h3>
            {isCurrentUser && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-black text-brand-600">
                You
              </span>
            )}
            <span className="text-xs font-bold text-slate-400">
              {comment.date}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {comment.body}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!isReply && (
              <button
                type="button"
                onClick={() => onReply(comment.id)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold text-brand-600 transition hover:bg-brand-50"
              >
                <Reply size={13} aria-hidden="true" />
                Reply
              </button>
            )}
            {comment.canDelete && (
              <button
                type="button"
                onClick={() => onDelete(comment)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={13} aria-hidden="true" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="mt-4 space-y-3 border-l-2 border-blue-100 pl-4 sm:ml-14">
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
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
              Community comments
            </p>
            <h2 className="mt-1 text-2xl font-black text-navy-900">
              {pluralizeComment(commentTotal)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ask questions, add context, or cheer on the story with a
              respectful comment.
            </p>
          </div>
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <MessageCircle size={22} aria-hidden="true" />
          </span>
        </div>

        <div className="mt-6 rounded-3xl border border-blue-100 bg-brand-50/35 p-4">
          {user && isApprovedMember ? (
            <div className="flex gap-3">
              <ProfileAvatar
                path={profile?.avatar_path}
                name={profile?.nickname || profile?.full_name || user.email}
                className="size-11 rounded-full"
                textClassName="text-xs"
              />
              <div className="min-w-0 flex-1">
                <CommentComposer
                  disabled={isSubmittingRoot}
                  error={composerError}
                  isSubmitting={isSubmittingRoot}
                  onSubmit={(body) => handleCreateComment(body)}
                />
              </div>
            </div>
          ) : user ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
              Your account needs approval before you can comment.
            </p>
          ) : (
            <p className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-slate-600">
              <Link to="/account" className="text-brand-600 underline">
                Sign in
              </Link>{' '}
              with an approved account to join the comments.
            </p>
          )}
        </div>

        <div className="mt-6">
          {isLoading ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
              Loading comments...
            </p>
          ) : loadError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {loadError}
            </p>
          ) : rootComments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-blue-200 bg-brand-50/30 p-7 text-center">
              <MessageCircle
                size={28}
                className="mx-auto text-brand-600"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-bold text-slate-600">
                No comments yet. Be the first to start the conversation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rootComments.map((comment) => (
                <div key={comment.id} className="grid gap-3">
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
                    <div className="ml-0 rounded-3xl border border-blue-100 bg-brand-50/35 p-4 sm:ml-14">
                      {user && isApprovedMember ? (
                        <CommentComposer
                          autoFocus
                          error={replyError}
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
                        <p className="text-sm font-bold text-slate-600">
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

        {deletingCommentId && (
          <p className="mt-4 text-xs font-bold text-slate-400">
            Removing comment...
          </p>
        )}
      </div>
    </section>
  )
}

export default NewsComments
