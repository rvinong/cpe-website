import {
  ChevronDown,
  MessageCircle,
  Send,
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
import NewsReactionSummary from './NewsReactionSummary'
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
          className={`w-full resize-none rounded-[1.35rem] border border-slate-200 bg-slate-100/80 px-4 py-3 pr-14 text-sm font-semibold text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
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
              className="rounded-full px-3 py-1 text-xs font-extrabold text-slate-500 transition hover:bg-slate-100 hover:text-navy-900"
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
    <article className="relative">
      <div className="flex items-start gap-2.5">
        <ProfileAvatar
          path={comment.avatarPath}
          name={comment.fullName}
          className={isReply ? 'size-8 rounded-full' : 'size-9 rounded-full'}
          textClassName="text-xs"
        />
        <div className="min-w-0 flex-1">
          <div className="inline-block max-w-full rounded-[1.25rem] bg-slate-100 px-3.5 py-2.5 text-left ring-1 ring-slate-200/70">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              <h3 className="truncate text-[13px] font-extrabold leading-4 text-navy-900">
                {comment.fullName}
              </h3>
              {isCurrentUser && (
                <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[9px] font-black leading-none text-brand-700">
                  You
                </span>
              )}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-[15px] leading-5 text-slate-700">
              {comment.body}
            </p>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 pl-3 text-[11px] font-extrabold text-slate-500">
            <span>{comment.date}</span>
            {!isReply && (
              <button
                type="button"
                onClick={() => onReply(comment.id)}
                className="transition hover:text-brand-600"
              >
                Reply
              </button>
            )}
            {comment.canDelete && (
              <button
                type="button"
                onClick={() => onDelete(comment)}
                className="inline-flex items-center gap-1 transition hover:text-red-600"
              >
                <Trash2 size={11} aria-hidden="true" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="relative ml-4 mt-2 space-y-2 border-l-2 border-slate-200 pl-4 sm:ml-4">
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
  initialReactionSummary,
  newsPostId,
  onCommentTotalChange,
  onReactionSummaryChange,
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
      <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_-48px_rgba(15,23,42,0.42)]">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <NewsReactionSummary
            className="w-full"
            initialSummary={initialReactionSummary}
            middleSlot={
              <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-1.5 py-1 text-xs font-extrabold text-slate-500">
                <MessageCircle size={16} aria-hidden="true" />
                {pluralizeComment(commentTotal)}
              </span>
            }
            newsPostId={newsPostId}
            onSummaryChange={onReactionSummaryChange}
            variant="comments"
          />
        </div>

        <div className="px-4 py-3 sm:px-5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-extrabold text-slate-500 transition hover:text-brand-600"
          >
            Most relevant
            <ChevronDown size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="px-4 pb-4 sm:px-5">
          {isLoading ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
              Loading comments...
            </p>
          ) : loadError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {loadError}
            </p>
          ) : rootComments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-brand-50/30 p-6 text-center">
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
                    <div className="ml-11 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
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

        <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-5">
          {user && isApprovedMember ? (
            <div className="flex items-start gap-3">
              <ProfileAvatar
                path={profile?.avatar_path}
                name={profile?.nickname || profile?.full_name || user.email}
                className="size-9 rounded-full"
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

        {deletingCommentId && (
          <p className="border-t border-slate-100 px-5 py-3 text-xs font-bold text-slate-400">
            Removing comment...
          </p>
        )}
      </div>
    </section>
  )
}

export default NewsComments
