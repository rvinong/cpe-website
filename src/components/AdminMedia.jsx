import {
  Camera,
  CirclePlus,
  Edit3,
  FileImage,
  Images,
  LoaderCircle,
  Newspaper,
  Save,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import AdminListSkeleton from './AdminListSkeleton'
import { signalBytePublished } from '../lib/byteAssistant'
import {
  createGalleryPhoto,
  createNewsPost,
  deleteGalleryPhoto,
  deleteNewsPost,
  galleryCategories,
  getAdminGalleryPhotos,
  getAdminNews,
  isMediaSchemaMissing,
  maxNewsImages,
  mediaBucket,
  newsCategories,
  removeMedia,
  updateGalleryPhoto,
  updateNewsPost,
  uploadMedia,
  validateMediaFile,
} from '../lib/media'
import {
  describeNotificationResult,
  notifyPublishedContent,
} from '../lib/notifications'
import { supabase } from '../lib/supabase'

const emptyNewsForm = {
  title: '',
  category: 'Organization',
  summary: '',
  body: '',
  imageAlt: '',
  status: 'draft',
  isFeatured: false,
}

const emptyPhotoForm = {
  album: '',
  category: 'Academic',
  description: '',
  altText: '',
  capturedOn: '',
  status: 'draft',
  sortOrder: 0,
}

const statusStyles = {
  draft: 'bg-amber-50 text-amber-700 ring-amber-200',
  published: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  archived: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const inputClassName =
  'admin-field mt-2 placeholder:text-slate-400'

function getImageUrl(path) {
  if (!path) return ''
  return supabase.storage.from(mediaBucket).getPublicUrl(path).data.publicUrl
}

function revokePreviewUrl(url) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}

function toNewsImageDraft(image) {
  const imagePath = image.imagePath || image.image_path || ''

  return {
    localId: image.id?.startsWith?.('legacy-')
      ? crypto.randomUUID()
      : image.id || crypto.randomUUID(),
    id: image.id?.startsWith?.('legacy-') ? null : image.id,
    imagePath,
    previewUrl: image.image || getImageUrl(imagePath),
    altText: image.altText || image.alt_text || '',
    caption: image.caption || '',
    file: null,
  }
}

function getNewsImagePaths(item) {
  const paths = new Set()

  item?.images?.forEach((image) => {
    const imagePath = image.imagePath || image.image_path
    if (imagePath) paths.add(imagePath)
  })

  if (item?.image_path) paths.add(item.image_path)

  return [...paths]
}

function AdminMedia() {
  const [activeTab, setActiveTab] = useState('news')
  const [news, setNews] = useState([])
  const [photos, setPhotos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editorType, setEditorType] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [newsForm, setNewsForm] = useState(emptyNewsForm)
  const [newsImageDrafts, setNewsImageDrafts] = useState([])
  const [photoForm, setPhotoForm] = useState(emptyPhotoForm)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [needsSchema, setNeedsSchema] = useState(false)

  useBodyScrollLock(Boolean(editorType))

  const loadMedia = useCallback(async () => {
    setIsLoading(true)
    const [newsResult, photoResult] = await Promise.all([
      getAdminNews(),
      getAdminGalleryPhotos(),
    ])
    const loadError = newsResult.error || photoResult.error

    if (loadError) {
      setError(loadError.message)
      setNeedsSchema(isMediaSchemaMissing(loadError))
    } else {
      setNews(newsResult.data)
      setPhotos(photoResult.data)
      setError('')
      setNeedsSchema(false)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true

    Promise.all([getAdminNews(), getAdminGalleryPhotos()]).then(
      ([newsResult, photoResult]) => {
        if (!isMounted) return
        const loadError = newsResult.error || photoResult.error

        if (loadError) {
          setError(loadError.message)
          setNeedsSchema(isMediaSchemaMissing(loadError))
        } else {
          setNews(newsResult.data)
          setPhotos(photoResult.data)
          setNeedsSchema(false)
        }

        setIsLoading(false)
      },
    )

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(
    () => () => {
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    },
    [previewUrl],
  )

  const counts = useMemo(
    () => ({
      publishedNews: news.filter((item) => item.status === 'published').length,
      draftNews: news.filter((item) => item.status === 'draft').length,
      publishedPhotos: photos.filter((item) => item.status === 'published')
        .length,
      albums: new Set(photos.map((item) => item.album)).size,
    }),
    [news, photos],
  )

  const resetEditor = () => {
    revokePreviewUrl(previewUrl)
    newsImageDrafts.forEach((image) => revokePreviewUrl(image.previewUrl))
    setEditorType(null)
    setEditingItem(null)
    setNewsForm(emptyNewsForm)
    setNewsImageDrafts([])
    setPhotoForm(emptyPhotoForm)
    setSelectedFile(null)
    setPreviewUrl('')
  }

  const openNewsEditor = (item = null) => {
    setEditingItem(item)
    setEditorType('news')
    setNewsForm(
      item
        ? {
            title: item.title,
            category: item.category,
            summary: item.summary,
            body: item.body,
            imageAlt: item.image_alt || '',
            status: item.status,
            isFeatured: item.is_featured,
          }
        : emptyNewsForm,
    )
    setNewsImageDrafts(item?.images?.map(toNewsImageDraft) || [])
    setPreviewUrl('')
    setSelectedFile(null)
    setError('')
    setSuccess('')
  }

  const openPhotoEditor = (item = null) => {
    setEditingItem(item)
    setEditorType('photo')
    setPhotoForm(
      item
        ? {
            album: item.album,
            category: item.category,
            description: item.description,
            altText: item.alt_text,
            capturedOn: item.captured_on,
            status: item.status,
            sortOrder: item.sort_order,
          }
        : emptyPhotoForm,
    )
    setPreviewUrl(getImageUrl(item?.image_path))
    setSelectedFile(null)
    setError('')
    setSuccess('')
  }

  const updateNewsField = (event) => {
    const { name, type, checked, value } = event.target
    setNewsForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const updatePhotoField = (event) => {
    const { name, value } = event.target
    setPhotoForm((current) => ({ ...current, [name]: value }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null
    const fileError = validateMediaFile(file)

    if (fileError) {
      setError(fileError)
      event.target.value = ''
      return
    }

    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setSelectedFile(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : '')
    setError('')
  }

  const handleNewsFilesChange = (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    if (newsImageDrafts.length + files.length > maxNewsImages) {
      setError(`News stories can include up to ${maxNewsImages} images.`)
      event.target.value = ''
      return
    }

    const fileError = files.map(validateMediaFile).find(Boolean)
    if (fileError) {
      setError(fileError)
      event.target.value = ''
      return
    }

    const drafts = files.map((file) => ({
      localId: crypto.randomUUID(),
      id: null,
      imagePath: '',
      previewUrl: URL.createObjectURL(file),
      altText: '',
      caption: '',
      file,
    }))

    setNewsImageDrafts((current) => [...current, ...drafts])
    setError('')
    event.target.value = ''
  }

  const updateNewsImageField = (localId, field, value) => {
    setNewsImageDrafts((current) =>
      current.map((image) =>
        image.localId === localId ? { ...image, [field]: value } : image,
      ),
    )
  }

  const moveNewsImage = (localId, direction) => {
    setNewsImageDrafts((current) => {
      const index = current.findIndex((image) => image.localId === localId)
      const targetIndex = index + direction

      if (index < 0 || targetIndex < 0 || targetIndex >= current.length) {
        return current
      }

      const next = [...current]
      const [image] = next.splice(index, 1)
      next.splice(targetIndex, 0, image)
      return next
    })
  }

  const removeNewsImageDraft = (localId) => {
    setNewsImageDrafts((current) => {
      const image = current.find((item) => item.localId === localId)
      revokePreviewUrl(image?.previewUrl)
      return current.filter((item) => item.localId !== localId)
    })
  }

  const saveNews = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (
      !newsForm.title.trim() ||
      !newsForm.summary.trim() ||
      !newsForm.body.trim()
    ) {
      setError('Title, summary, and full story are required.')
      return
    }

    if (newsImageDrafts.length > maxNewsImages) {
      setError(`News stories can include up to ${maxNewsImages} images.`)
      return
    }

    if (newsImageDrafts.some((image) => !image.altText.trim())) {
      setError('Add alternative text for every news image.')
      return
    }

    setIsSaving(true)
    const uploadedPaths = []
    const preparedImages = []

    for (const image of newsImageDrafts) {
      let imagePath = image.imagePath

      if (image.file) {
        const uploadResult = await uploadMedia(image.file, 'news')
        if (uploadResult.error) {
          await Promise.all(uploadedPaths.map((path) => removeMedia(path)))
          setError(uploadResult.error.message)
          setIsSaving(false)
          return
        }

        imagePath = uploadResult.data.path
        uploadedPaths.push(imagePath)
      }

      preparedImages.push({
        imagePath,
        altText: image.altText,
        caption: image.caption,
      })
    }

    const result = editingItem
      ? await updateNewsPost(
          editingItem.id,
          newsForm,
          preparedImages,
          editingItem.published_at,
        )
      : await createNewsPost(newsForm, preparedImages)

    if (result.error) {
      await Promise.all(uploadedPaths.map((path) => removeMedia(path)))
      setError(result.error.message)
      setNeedsSchema(isMediaSchemaMissing(result.error))
      setIsSaving(false)
      return
    }

    if (editingItem) {
      const savedPaths = new Set(preparedImages.map((image) => image.imagePath))
      const deletedPaths = getNewsImagePaths(editingItem).filter(
        (path) => !savedPaths.has(path),
      )
      await Promise.all(deletedPaths.map((path) => removeMedia(path)))
    }

    let successMessage = editingItem
      ? 'News story updated.'
      : 'News story created.'

    const shouldNotify =
      result.data.status === 'published' &&
      editingItem?.status !== 'published'

    if (shouldNotify) {
      signalBytePublished('news', result.data.title)
      const notificationResult = await notifyPublishedContent(
        'news',
        result.data.id,
      )
      successMessage += describeNotificationResult(notificationResult)
    }

    setIsSaving(false)
    setSuccess(successMessage)
    resetEditor()
    await loadMedia()
  }

  const savePhoto = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (
      !photoForm.album.trim() ||
      !photoForm.altText.trim() ||
      !photoForm.capturedOn
    ) {
      setError('Album, image description, and activity date are required.')
      return
    }

    if (!editingItem && !selectedFile) {
      setError('Select an approved image to upload.')
      return
    }

    setIsSaving(true)
    let uploadedPath = null

    if (selectedFile) {
      const uploadResult = await uploadMedia(selectedFile, 'gallery')
      if (uploadResult.error) {
        setError(uploadResult.error.message)
        setIsSaving(false)
        return
      }
      uploadedPath = uploadResult.data.path
    }

    const imagePath = uploadedPath || editingItem.image_path
    const result = editingItem
      ? await updateGalleryPhoto(editingItem.id, photoForm, imagePath)
      : await createGalleryPhoto(photoForm, imagePath)

    if (result.error) {
      if (uploadedPath) await removeMedia(uploadedPath)
      setError(result.error.message)
      setNeedsSchema(isMediaSchemaMissing(result.error))
      setIsSaving(false)
      return
    }

    if (uploadedPath && editingItem?.image_path) {
      await removeMedia(editingItem.image_path)
    }

    if (
      result.data.status === 'published' &&
      editingItem?.status !== 'published'
    ) {
      signalBytePublished('gallery', result.data.album)
    }

    setIsSaving(false)
    setSuccess(editingItem ? 'Gallery photo updated.' : 'Gallery photo added.')
    resetEditor()
    await loadMedia()
  }

  const handleDeleteNews = async (item) => {
    if (!window.confirm(`Delete "${item.title}" permanently?`)) return

    const { error: deleteError } = await deleteNewsPost(item.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    await Promise.all(getNewsImagePaths(item).map((path) => removeMedia(path)))
    setSuccess('News story deleted.')
    await loadMedia()
  }

  const handleDeletePhoto = async (item) => {
    if (!window.confirm(`Delete this photo from "${item.album}"?`)) return

    const { error: deleteError } = await deleteGalleryPhoto(item.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    await removeMedia(item.image_path)
    setSuccess('Gallery photo deleted.')
    await loadMedia()
  }

  const currentItems = activeTab === 'news' ? news : photos

  return (
    <div className="admin-page mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">
            Publishing and media
          </p>
          <h2 className="mt-2 text-3xl font-black text-navy-900">
            News & Gallery
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Publish verified stories and maintain the approved organization
            photo archive.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            activeTab === 'news' ? openNewsEditor() : openPhotoEditor()
          }
          disabled={needsSchema}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CirclePlus size={18} />
          {activeTab === 'news' ? 'New story' : 'Add photo'}
        </button>
      </div>

      {needsSchema && (
        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-extrabold text-amber-900">
            Database and Storage setup required
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Run{' '}
            <code className="rounded bg-white px-1.5 py-1 font-bold">
              supabase/media.sql
            </code>{' '}
            in the Supabase SQL Editor, then refresh this page.
          </p>
        </div>
      )}

      {(error || success) && !needsSchema && !editorType && (
        <div
          className={`mt-7 rounded-xl border px-4 py-3 text-sm font-bold ${
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
          role="status"
        >
          {error || success}
        </div>
      )}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Published news', counts.publishedNews, Newspaper],
          ['News drafts', counts.draftNews, FileImage],
          ['Published photos', counts.publishedPhotos, Camera],
          ['Albums', counts.albums, Images],
        ].map(([label, value, Icon]) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon size={19} />
              </span>
              <span className="text-3xl font-black text-navy-900">{value}</span>
            </div>
            <p className="mt-4 text-xs font-extrabold tracking-wide text-slate-500 uppercase">
              {label}
            </p>
          </article>
        ))}
      </section>

      <div className="mt-7 flex gap-2 rounded-xl border border-slate-200 bg-white p-1.5">
        {[
          ['news', 'News stories', Newspaper],
          ['gallery', 'Gallery photos', Images],
        ].map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setActiveTab(key)
              setError('')
              setSuccess('')
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-extrabold transition ${
              activeTab === key
                ? 'bg-brand-600 text-white'
                : 'text-slate-500 hover:bg-brand-50 hover:text-brand-600'
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {isLoading ? (
          <AdminListSkeleton withMedia label="Loading media" />
        ) : currentItems.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              {activeTab === 'news' ? (
                <Newspaper size={24} />
              ) : (
                <Images size={24} />
              )}
            </span>
            <h3 className="mt-5 text-lg font-black text-navy-900">
              No {activeTab === 'news' ? 'news stories' : 'gallery photos'} yet
            </h3>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {currentItems.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 px-5 py-5 sm:grid-cols-[96px_1fr_auto] sm:items-center sm:px-6"
              >
                {item.image_path ? (
                  <img
                    src={getImageUrl(item.image_path)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3] w-24 rounded-xl bg-slate-100 object-cover"
                  />
                ) : (
                  <span className="grid aspect-[4/3] w-24 place-items-center rounded-xl bg-slate-100 text-slate-400">
                    <FileImage size={24} />
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ring-1 ring-inset ${
                        statusStyles[item.status]
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {item.category}
                    </span>
                    {item.is_featured && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-600">
                        <Star size={13} fill="currentColor" />
                        Featured
                      </span>
                    )}
                  </div>
                  <h4 className="mt-2 truncate text-lg font-black text-navy-900">
                    {activeTab === 'news' ? item.title : item.album}
                  </h4>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-600">
                    {activeTab === 'news'
                      ? item.summary
                      : item.description || item.alt_text}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      activeTab === 'news'
                        ? openNewsEditor(item)
                        : openPhotoEditor(item)
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-extrabold text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
                  >
                    <Edit3 size={15} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      activeTab === 'news'
                        ? handleDeleteNews(item)
                        : handleDeletePhoto(item)
                    }
                    className="grid size-10 place-items-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                    aria-label={`Delete ${activeTab === 'news' ? item.title : item.album}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editorType && (
        <div
          className="admin-modal-backdrop fixed inset-0 z-[70] overflow-y-auto bg-navy-950/70 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Media editor"
        >
          <div className="mx-auto my-4 max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl sm:my-8">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">
                  {editingItem ? 'Edit media' : 'Add media'}
                </p>
                <h3 className="mt-1 text-2xl font-black text-navy-900">
                  {editorType === 'news'
                    ? editingItem
                      ? 'Update news story'
                      : 'New news story'
                    : editingItem
                      ? 'Update gallery photo'
                      : 'Add gallery photo'}
                </h3>
              </div>
              <button
                type="button"
                onClick={resetEditor}
                className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500"
                aria-label="Close media editor"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={editorType === 'news' ? saveNews : savePhoto}
              className="px-5 py-6 sm:px-7"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                {editorType === 'news' ? (
                  <>
                    <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                      Story title
                      <input
                        name="title"
                        value={newsForm.title}
                        onChange={updateNewsField}
                        className={inputClassName}
                        maxLength={160}
                        required
                      />
                    </label>
                    <label className="text-sm font-extrabold text-navy-900">
                      Category
                      <select
                        name="category"
                        value={newsForm.category}
                        onChange={updateNewsField}
                        className={inputClassName}
                      >
                        {newsCategories.map((category) => (
                          <option key={category}>{category}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-extrabold text-navy-900">
                      Status
                      <select
                        name="status"
                        value={newsForm.status}
                        onChange={updateNewsField}
                        className={inputClassName}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </label>
                    <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                      Summary
                      <textarea
                        name="summary"
                        value={newsForm.summary}
                        onChange={updateNewsField}
                        className={`${inputClassName} min-h-24 resize-y`}
                        maxLength={360}
                        required
                      />
                    </label>
                    <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                      Full story
                      <textarea
                        name="body"
                        value={newsForm.body}
                        onChange={updateNewsField}
                        className={`${inputClassName} min-h-44 resize-y leading-7`}
                        required
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                      Album name
                      <input
                        name="album"
                        value={photoForm.album}
                        onChange={updatePhotoField}
                        className={inputClassName}
                        maxLength={160}
                        required
                      />
                    </label>
                    <label className="text-sm font-extrabold text-navy-900">
                      Category
                      <select
                        name="category"
                        value={photoForm.category}
                        onChange={updatePhotoField}
                        className={inputClassName}
                      >
                        {galleryCategories.map((category) => (
                          <option key={category}>{category}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-extrabold text-navy-900">
                      Status
                      <select
                        name="status"
                        value={photoForm.status}
                        onChange={updatePhotoField}
                        className={inputClassName}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </label>
                    <label className="text-sm font-extrabold text-navy-900">
                      Activity date
                      <input
                        type="date"
                        name="capturedOn"
                        value={photoForm.capturedOn}
                        onChange={updatePhotoField}
                        className={inputClassName}
                        required
                      />
                    </label>
                    <label className="text-sm font-extrabold text-navy-900">
                      Display order
                      <input
                        type="number"
                        name="sortOrder"
                        value={photoForm.sortOrder}
                        onChange={updatePhotoField}
                        className={inputClassName}
                        min="0"
                      />
                    </label>
                    <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                      Image description
                      <input
                        name="altText"
                        value={photoForm.altText}
                        onChange={updatePhotoField}
                        className={inputClassName}
                        placeholder="Describe who or what is shown"
                        required
                      />
                    </label>
                    <label className="text-sm font-extrabold text-navy-900 sm:col-span-2">
                      Activity description
                      <textarea
                        name="description"
                        value={photoForm.description}
                        onChange={updatePhotoField}
                        className={`${inputClassName} min-h-24 resize-y`}
                      />
                    </label>
                  </>
                )}
              </div>

              {editorType === 'news' ? (
                <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-brand-50/35 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-extrabold text-navy-900">
                        Story images
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Add up to {maxNewsImages} JPG, PNG, or WebP images.
                        The first image becomes the cover.
                      </p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-brand-600 ring-1 ring-blue-100">
                      <Upload size={17} />
                      Add images
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleNewsFilesChange}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  <p className="mt-3 text-xs font-bold text-slate-500">
                    {newsImageDrafts.length} / {maxNewsImages} images selected
                  </p>

                  {newsImageDrafts.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-blue-200 bg-white/70 p-6 text-center text-sm font-bold text-slate-500">
                      No images attached yet. The story can still be saved as a
                      text-only update.
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-4">
                      {newsImageDrafts.map((image, index) => (
                        <article
                          key={image.localId}
                          className="grid gap-4 rounded-2xl border border-blue-100 bg-white p-4 sm:grid-cols-[140px_1fr]"
                        >
                          <div>
                            <img
                              src={image.previewUrl}
                              alt=""
                              className="aspect-[4/3] w-full rounded-xl bg-slate-100 object-cover"
                            />
                            {index === 0 && (
                              <span className="mt-2 inline-flex rounded-full bg-brand-600 px-2.5 py-1 text-[10px] font-extrabold text-white">
                                Cover
                              </span>
                            )}
                          </div>

                          <div className="grid gap-3">
                            <label className="text-sm font-extrabold text-navy-900">
                              Alternative text
                              <input
                                value={image.altText}
                                onChange={(event) =>
                                  updateNewsImageField(
                                    image.localId,
                                    'altText',
                                    event.target.value,
                                  )
                                }
                                className={inputClassName}
                                placeholder="Describe the image for screen readers"
                                required
                              />
                            </label>
                            <label className="text-sm font-extrabold text-navy-900">
                              Caption
                              <input
                                value={image.caption}
                                onChange={(event) =>
                                  updateNewsImageField(
                                    image.localId,
                                    'caption',
                                    event.target.value,
                                  )
                                }
                                className={inputClassName}
                                placeholder="Optional short caption"
                              />
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => moveNewsImage(image.localId, -1)}
                                disabled={index === 0}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-extrabold text-slate-600 transition hover:border-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Move up
                              </button>
                              <button
                                type="button"
                                onClick={() => moveNewsImage(image.localId, 1)}
                                disabled={index === newsImageDrafts.length - 1}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-extrabold text-slate-600 transition hover:border-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Move down
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  removeNewsImageDraft(image.localId)
                                }
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-brand-50/35 p-5">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-brand-600 ring-1 ring-blue-100">
                    <Upload size={17} />
                    {selectedFile
                      ? 'Choose another image'
                      : editingItem
                        ? 'Replace image'
                        : 'Choose image'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="mt-2 text-center text-xs text-slate-500">
                    JPG, PNG, or WebP. Maximum 8 MB.
                  </p>
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Selected upload preview"
                      className="mx-auto mt-4 max-h-64 rounded-xl object-contain"
                    />
                  )}
                </div>
              )}

              {editorType === 'news' && (
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-blue-100 bg-brand-50/45 p-4">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={newsForm.isFeatured}
                    onChange={updateNewsField}
                    className="mt-0.5 size-4 accent-blue-600"
                  />
                  <span className="text-sm font-extrabold text-navy-900">
                    Feature this story on the homepage
                  </span>
                </label>
              )}

              {error && (
                <p
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetEditor}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-extrabold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {isSaving ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminMedia
