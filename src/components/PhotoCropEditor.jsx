import {
  Check,
  Crop,
  LoaderCircle,
  RotateCcw,
  X,
  ZoomIn,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const MAX_OUTPUT_WIDTH = 1600
const acceptedOutputTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

function getBaseName(fileName) {
  return String(fileName || 'photo')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'photo'
}

function getOutputType(sourceFile) {
  return acceptedOutputTypes.has(sourceFile?.type)
    ? sourceFile.type
    : 'image/jpeg'
}

function getOutputExtension(outputType) {
  if (outputType === 'image/png') return 'png'
  if (outputType === 'image/webp') return 'webp'
  return 'jpg'
}

function getFrameForZoom(naturalSize, stageSize, nextZoom) {
  if (
    !naturalSize ||
    !stageSize.width ||
    !stageSize.height ||
    !Number.isFinite(nextZoom)
  ) {
    return null
  }

  const baseScale = Math.max(
    stageSize.width / naturalSize.width,
    stageSize.height / naturalSize.height,
  )
  const scale = baseScale * nextZoom

  return {
    width: naturalSize.width * scale,
    height: naturalSize.height * scale,
    scale,
  }
}

function PhotoCropEditor({
  image,
  sourceFile = null,
  aspectRatio = 16 / 7,
  title = 'Adjust photo framing',
  label = 'Adjust crop',
  fileName = '',
  disabled = false,
  onApply,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [imageError, setImageError] = useState('')
  const [naturalSize, setNaturalSize] = useState(null)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [hasPosition, setHasPosition] = useState(false)
  const stageRef = useRef(null)
  const imageRef = useRef(null)
  const dragRef = useRef(null)

  const isExternalImage =
    Boolean(image) &&
    !image.startsWith('blob:') &&
    !image.startsWith('data:')

  const frame = getFrameForZoom(naturalSize, stageSize, zoom)

  const centerPosition = (nextFrame) => ({
    x: (stageSize.width - nextFrame.width) / 2,
    y: (stageSize.height - nextFrame.height) / 2,
  })

  const clampPosition = (nextPosition, nextFrame = frame) => {
    if (!nextFrame) return nextPosition

    return {
      x: clamp(
        nextPosition.x,
        Math.min(0, stageSize.width - nextFrame.width),
        0,
      ),
      y: clamp(
        nextPosition.y,
        Math.min(0, stageSize.height - nextFrame.height),
        0,
      ),
    }
  }

  const visiblePosition =
    hasPosition && frame ? clampPosition(position) : frame
      ? centerPosition(frame)
      : position

  const openCropEditor = () => {
    setImageError('')
    setNaturalSize(null)
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setHasPosition(false)
    setIsOpen(true)
  }

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isApplying) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isApplying, isOpen])

  useEffect(() => {
    if (!isOpen || !stageRef.current) return undefined

    const updateStageSize = () => {
      const rect = stageRef.current.getBoundingClientRect()
      setStageSize({
        width: rect.width,
        height: rect.height,
      })
    }

    updateStageSize()

    if (!globalThis.ResizeObserver) return undefined

    const observer = new globalThis.ResizeObserver(updateStageSize)
    observer.observe(stageRef.current)
    return () => observer.disconnect()
  }, [isOpen])

  const handleImageLoad = (event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget

    if (!naturalWidth || !naturalHeight) {
      setImageError('This image could not be loaded for editing.')
      return
    }

    setNaturalSize({
      width: naturalWidth,
      height: naturalHeight,
    })
    setImageError('')
  }

  const handleImageError = () => {
    setImageError(
      'This photo could not be edited. Try uploading the image again.',
    )
  }

  const handleZoomChange = (event) => {
    const nextZoom = Number(event.target.value)
    const previousFrame = frame
    const nextFrame = getFrameForZoom(naturalSize, stageSize, nextZoom)

    if (previousFrame && nextFrame) {
      setPosition(
        clampPosition(
          {
            x:
              visiblePosition.x +
              previousFrame.width / 2 -
              nextFrame.width / 2,
            y:
              visiblePosition.y +
              previousFrame.height / 2 -
              nextFrame.height / 2,
          },
          nextFrame,
        ),
      )
    }

    setZoom(nextZoom)
  }

  const handleReset = () => {
    const resetFrame = getFrameForZoom(naturalSize, stageSize, 1)
    setZoom(1)
    if (resetFrame) {
      setPosition(centerPosition(resetFrame))
      setHasPosition(true)
    }
  }

  const handlePointerDown = (event) => {
    if (!frame || isApplying) return

    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: visiblePosition,
    }
    setHasPosition(true)
    event.currentTarget.classList.add('is-dragging')
  }

  const handlePointerMove = (event) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    setPosition(
      clampPosition({
        x: drag.startPosition.x + event.clientX - drag.startX,
        y: drag.startPosition.y + event.clientY - drag.startY,
      }),
    )
  }

  const handlePointerUp = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
    event.currentTarget.classList.remove('is-dragging')
  }

  const handleApply = async () => {
    if (!imageRef.current || !frame || !naturalSize || isApplying) return

    setIsApplying(true)
    setImageError('')

    const sourceX = clamp(
      -visiblePosition.x / frame.scale,
      0,
      Math.max(0, naturalSize.width - stageSize.width / frame.scale),
    )
    const sourceY = clamp(
      -visiblePosition.y / frame.scale,
      0,
      Math.max(0, naturalSize.height - stageSize.height / frame.scale),
    )
    const sourceWidth = Math.min(
      naturalSize.width,
      stageSize.width / frame.scale,
    )
    const sourceHeight = Math.min(
      naturalSize.height,
      stageSize.height / frame.scale,
    )
    const outputWidth = Math.min(
      MAX_OUTPUT_WIDTH,
      Math.max(1, Math.round(sourceWidth)),
    )
    const outputHeight = Math.max(
      1,
      Math.round(outputWidth * (sourceHeight / sourceWidth)),
    )
    const outputType = getOutputType(sourceFile)
    const canvas = document.createElement('canvas')
    canvas.width = outputWidth
    canvas.height = outputHeight

    try {
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas is not available')

      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(
        imageRef.current,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight,
      )

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setImageError('The edited photo could not be prepared.')
            setIsApplying(false)
            return
          }

          const extension = getOutputExtension(outputType)
          const croppedFile = new File(
            [blob],
            getBaseName(fileName || sourceFile?.name) + '-cropped.' + extension,
            {
              type: outputType,
              lastModified: Date.now(),
            },
          )
          const croppedPreviewUrl = URL.createObjectURL(croppedFile)

          try {
            await onApply?.({
              file: croppedFile,
              previewUrl: croppedPreviewUrl,
            })
            setIsOpen(false)
          } catch (error) {
            URL.revokeObjectURL(croppedPreviewUrl)
            setImageError(
              error instanceof Error
                ? error.message
                : 'The edited photo could not be applied.',
            )
          } finally {
            setIsApplying(false)
          }
        },
        outputType,
        outputType === 'image/jpeg' ? 0.92 : undefined,
      )
    } catch {
      setImageError(
        'This photo cannot be cropped from its current source. Upload it again and retry.',
      )
      setIsApplying(false)
    }
  }

  const modal = (
    <div
      className="photo-crop-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isApplying) {
          setIsOpen(false)
        }
      }}
    >
      <section
        className="photo-crop-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-crop-title"
      >
        <header className="photo-crop-modal-header">
          <div>
            <p className="photo-crop-kicker">Photo framing</p>
            <h2 id="photo-crop-title">{title}</h2>
          </div>
          <button
            type="button"
            className="photo-crop-close"
            onClick={() => setIsOpen(false)}
            disabled={isApplying}
            aria-label="Close photo editor"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="photo-crop-modal-content">
          <p className="photo-crop-instruction">
            Drag the photo to choose what stays visible, then use the zoom
            control to fine-tune the frame.
          </p>

          <div
            ref={stageRef}
            className="photo-crop-stage"
            style={{ aspectRatio: String(aspectRatio) }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {image && (
              <img
                ref={imageRef}
                src={image}
                alt=""
                crossOrigin={isExternalImage ? 'anonymous' : undefined}
                className="photo-crop-image"
                draggable="false"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={
                  frame
                    ? {
                        width: frame.width,
                        height: frame.height,
                        transform:
                          'translate3d(' +
                          visiblePosition.x +
                          'px, ' +
                          visiblePosition.y +
                          'px, 0)',
                      }
                    : undefined
                }
              />
            )}
            <span className="photo-crop-grid" aria-hidden="true" />
            {!naturalSize && !imageError && (
              <span className="photo-crop-loading">Loading photo...</span>
            )}
            {imageError && (
              <span className="photo-crop-error">{imageError}</span>
            )}
          </div>

          <div className="photo-crop-controls">
            <label className="photo-crop-zoom-label" htmlFor="photo-crop-zoom">
              <span>
                <ZoomIn size={15} aria-hidden="true" />
                Zoom
              </span>
              <strong>{Math.round(zoom * 100)}%</strong>
            </label>
            <input
              id="photo-crop-zoom"
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={handleZoomChange}
              disabled={!naturalSize || isApplying}
              aria-label="Photo zoom"
            />
            <button
              type="button"
              className="photo-crop-reset"
              onClick={handleReset}
              disabled={!naturalSize || isApplying}
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset
            </button>
          </div>
        </div>

        <footer className="photo-crop-modal-actions">
          <button
            type="button"
            className="photo-crop-cancel"
            onClick={() => setIsOpen(false)}
            disabled={isApplying}
          >
            Cancel
          </button>
          <button
            type="button"
            className="photo-crop-apply"
            onClick={handleApply}
            disabled={!naturalSize || Boolean(imageError) || isApplying}
          >
            {isApplying ? (
              <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Check size={16} aria-hidden="true" />
            )}
            {isApplying ? 'Preparing photo...' : 'Apply crop'}
          </button>
        </footer>
      </section>
    </div>
  )

  return (
    <>
      <button
        type="button"
        className="photo-crop-trigger"
        onClick={openCropEditor}
        disabled={!image || disabled}
      >
        <Crop size={15} aria-hidden="true" />
        {label}
      </button>
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(modal, document.body)}
    </>
  )
}

export default PhotoCropEditor
