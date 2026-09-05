import {
  AnimatePresence,
  motion as Motion,
} from 'framer-motion'
import {
  Archive,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  LockKeyhole,
  Minus,
  PackageCheck,
  Plus,
  Search,
  Shirt,
  ShoppingBag,
  Sparkles,
  Tag,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ContentSkeleton from '../components/ContentSkeleton'
import EmptyState from '../components/EmptyState'
import PageHero from '../components/PageHero'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import useAuth from '../context/useAuth'
import { fallbackMerchandise } from '../data/merchandise'
import {
  createMerchandiseOrder,
  formatMerchandiseOrderDate,
  formatMerchandisePrice,
  getMerchandiseOrderStatusLabel,
  getMyMerchandiseOrders,
  getPublishedMerchandise,
  isMerchandiseSchemaMissing,
} from '../lib/merchandise'
import { isSupabaseConfigured } from '../lib/supabase'

const cartStorageKey = 'icpep-merchandise-cart'

const emptyCheckoutForm = {
  customerName: '',
  contactNumber: '',
  paymentMethod: 'cash_on_pickup',
  notes: '',
}

function readStoredCart() {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(cartStorageKey) || '[]')
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.productId === 'string' &&
          typeof item.variantId === 'string' &&
          Number.isInteger(item.quantity),
      )
      .map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: Math.min(10, Math.max(1, item.quantity)),
      }))
      .slice(0, 30)
  } catch {
    return []
  }
}

function getBatchSortValue(batch) {
  const year = Number.parseInt(String(batch).match(/\d{4}/)?.[0] || '', 10)
  return Number.isFinite(year) ? year : 0
}

function getProductVariant(product, variantId) {
  return product?.variants?.find((variant) => variant.id === variantId) || null
}

function getAvailableVariant(product) {
  return product?.variants?.find((variant) => variant.stock > 0) || product?.variants?.[0] || null
}

function MerchandiseArtwork({ product, compact = false }) {
  const category = String(product?.category || 'Shirts').toLowerCase()
  const isHoodie = category === 'hoodies'
  const isAccessory = category === 'accessories'

  return (
    <div
      className={`merch-artwork merch-artwork-${isHoodie ? 'hoodie' : isAccessory ? 'accessory' : 'shirt'} ${compact ? 'merch-artwork-compact' : ''}`}
      aria-hidden="true"
    >
      <span className="merch-artwork-orbit" />
      <span className="merch-artwork-glow" />
      <span className="merch-artwork-icon">
        {isAccessory ? <Tag size={compact ? 40 : 68} /> : <Shirt size={compact ? 54 : 88} />}
      </span>
      <span className="merch-artwork-label">
        {product?.batch || 'ICpEP.SE'}
      </span>
      <span className="merch-artwork-code">{isHoodie ? 'HOODIE' : isAccessory ? 'ESSENTIAL' : 'CHAPTER EDITION'}</span>
    </div>
  )
}

function ProductImage({ product, compact = false }) {
  if (!product?.frontImage) {
    return <MerchandiseArtwork product={product} compact={compact} />
  }

  return (
    <img
      src={product.frontImage}
      alt={product.image_alt || `${product.name} front design`}
      className="size-full object-contain"
      loading="lazy"
    />
  )
}

function getProductGallery(product) {
  if (!product) return []

  return [
    {
      key: 'front',
      label: 'Front design',
      src: product.frontImage || '',
      alt: product.image_alt || `${product.name} front design`,
    },
    ...(product.backImage
      ? [
          {
            key: 'back',
            label: 'Back design',
            src: product.backImage,
            alt: `${product.name} back design`,
          },
        ]
      : []),
  ]
}

function ProductGalleryVisual({ product, item, compact = false }) {
  if (item?.src) {
    return (
      <img
        src={item.src}
        alt={item.alt}
        className={compact ? 'size-full object-cover' : 'merch-gallery-main-image'}
        loading={compact ? 'lazy' : 'eager'}
      />
    )
  }

  return <MerchandiseArtwork product={product} compact={compact} />
}

function ProductCard({ product, onOpen }) {
  const isArchived = product.status === 'archived'
  const hasStock = !isArchived && product.totalStock > 0
  const availableSizes = product.variants
    .filter((variant) => variant.stock > 0)
    .map((variant) => variant.size)
    .slice(0, 5)

  return (
    <Motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      className={`merch-product-card surface-card ${isArchived ? 'merch-product-card-archived' : ''}`}
    >
      <button
        type="button"
        className="merch-product-media"
        onClick={() => onOpen(product)}
        aria-label={`View ${product.name}`}
      >
        <ProductImage product={product} />
        <span className={`merch-product-status ${isArchived ? 'merch-product-status-archive' : ''}`}>
          {isArchived ? 'Batch archive' : product.is_featured ? 'Featured drop' : 'Available now'}
        </span>
        {product.frontImage && product.backImage && (
          <span className="merch-product-gallery-hint">Front + back</span>
        )}
      </button>

      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="merch-batch-label">{product.batch || 'Chapter collection'}</span>
          <span className="text-xs font-bold text-slate-400">{product.category}</span>
        </div>
        <h3 className="mt-3 text-xl font-black tracking-tight text-navy-900">
          {product.name}
        </h3>
        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
          {product.description || 'Official ICpEP.SE chapter merchandise.'}
        </p>

        <div className="mt-5 flex min-h-7 flex-wrap items-center gap-1.5">
          {availableSizes.length > 0 ? (
            availableSizes.map((size) => (
              <span key={size} className="merch-size-chip">
                {size}
              </span>
            ))
          ) : (
            <span className="text-xs font-bold text-slate-400">
              Archive design
            </span>
          )}
        </div>

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-100 pt-5">
          <div>
            <p className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
              {isArchived ? 'Original price' : 'From'}
            </p>
            <p className="mt-1 text-xl font-black text-navy-900">
              {formatMerchandisePrice(product.price)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpen(product)}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition ${
              hasStock
                ? 'bg-brand-600 text-white shadow-lg shadow-blue-600/15 hover:-translate-y-0.5 hover:bg-brand-700'
                : 'border border-slate-200 bg-slate-50 text-slate-500 hover:border-brand-300 hover:text-brand-600'
            }`}
          >
            {hasStock ? 'Choose options' : 'View design'}
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </Motion.article>
  )
}

function OrderHistory({ orders }) {
  if (orders.length === 0) return null

  return (
    <section className="merch-orders-section bg-white py-20 sm:py-24">
      <div className="section-shell">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
              Your chapter orders
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
              Order history
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Keep track of recent merchandise requests and their campus collection status.
            </p>
          </div>
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <PackageCheck size={22} aria-hidden="true" />
          </span>
        </div>

        <div className="mt-9 grid gap-4 lg:grid-cols-2">
          {orders.map((order) => (
            <article key={order.id} className="merch-order-card surface-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.15em] text-brand-600 uppercase">
                    {order.order_number}
                  </p>
                  <p className="mt-2 text-xs font-bold text-slate-400">
                    {formatMerchandiseOrderDate(order.created_at)}
                  </p>
                </div>
                <span className={`merch-order-status merch-order-status-${order.status}`}>
                  {getMerchandiseOrderStatusLabel(order.status)}
                </span>
              </div>
              <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 text-sm">
                    <span className="min-w-0 truncate text-slate-600">
                      {item.quantity} x {item.product_name} ({item.variant_size})
                    </span>
                    <span className="shrink-0 font-extrabold text-navy-900">
                      {formatMerchandisePrice(item.line_total)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                <span className="text-xs font-bold text-slate-500">
                  Campus collection
                </span>
                <span className="text-lg font-black text-navy-900">
                  {formatMerchandisePrice(order.subtotal)}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Merchandise() {
  const { user, profile, isApprovedMember } = useAuth()
  const [products, setProducts] = useState(isSupabaseConfigured ? [] : fallbackMerchandise)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [loadError, setLoadError] = useState('')
  const [needsSchema, setNeedsSchema] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [collectionView, setCollectionView] = useState('all')
  const [selectedBatch, setSelectedBatch] = useState('All batches')
  const [cart, setCart] = useState(readStoredCart)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState(emptyCheckoutForm)
  const [checkoutError, setCheckoutError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const [orders, setOrders] = useState([])
  const [ordersUserId, setOrdersUserId] = useState('')
  const [ordersError, setOrdersError] = useState('')

  const customerFullName =
    profile?.full_name?.trim() || user?.user_metadata?.full_name?.trim() || ''
  const hasOpenPanel = Boolean(
    selectedProduct || isCartOpen || isCheckoutOpen || confirmation,
  )
  useBodyScrollLock(hasOpenPanel)

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    let isMounted = true

    getPublishedMerchandise().then(({ data, error }) => {
      if (!isMounted) return

      if (error) {
        setProducts([])
        setNeedsSchema(isMerchandiseSchemaMissing(error))
        setLoadError(
          isMerchandiseSchemaMissing(error)
            ? 'The merchandise catalog is still being prepared.'
            : 'The merchandise catalog could not be loaded right now.',
        )
      } else {
        setProducts(data || [])
        setNeedsSchema(false)
        setLoadError('')
      }

      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    if (!user?.id || !isApprovedMember || !isSupabaseConfigured) {
      return undefined
    }

    let isMounted = true
    const requestedUserId = user.id
    getMyMerchandiseOrders(requestedUserId).then(({ data, error }) => {
      if (!isMounted) return
      if (error) {
        setOrdersError('Your order history is temporarily unavailable.')
      } else {
        setOrders(data || [])
        setOrdersUserId(requestedUserId)
        setOrdersError('')
      }
    })

    return () => {
      isMounted = false
    }
  }, [isApprovedMember, user?.id])

  const batches = useMemo(() => {
    return [
      'All batches',
      ...[...new Set(products.map((product) => product.batch).filter(Boolean))].sort(
        (first, second) => getBatchSortValue(second) - getBatchSortValue(first) || first.localeCompare(second),
      ),
    ]
  }, [products])

  const currentProducts = useMemo(
    () => products.filter((product) => product.status === 'published'),
    [products],
  )
  const archivedProducts = useMemo(
    () => products.filter((product) => product.status === 'archived'),
    [products],
  )
  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const viewProducts =
      collectionView === 'current'
        ? currentProducts
        : collectionView === 'archive'
          ? archivedProducts
          : products.filter((product) => ['published', 'archived'].includes(product.status))

    return viewProducts.filter((product) => {
      const matchesBatch = selectedBatch === 'All batches' || product.batch === selectedBatch
      const matchesSearch =
        !normalizedSearch ||
        [product.name, product.batch, product.category, product.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)

      return matchesBatch && matchesSearch
    })
  }, [archivedProducts, collectionView, currentProducts, products, searchTerm, selectedBatch])

  const cartLines = useMemo(() => {
    return cart
      .map((entry) => {
        const product = products.find((item) => item.id === entry.productId)
        const variant = getProductVariant(product, entry.variantId)
        if (!product || !variant) return null

        const maxQuantity = Math.min(10, variant.stock)
        const quantity = Math.min(entry.quantity, maxQuantity)
        if (quantity < 1) return null

        return {
          ...entry,
          quantity,
          product,
          variant,
          variant_id: variant.id,
          unitPrice: product.price,
          lineTotal: product.price * quantity,
        }
      })
      .filter(Boolean)
  }, [cart, products])

  const cartCount = cartLines.reduce((total, line) => total + line.quantity, 0)
  const cartTotal = cartLines.reduce((total, line) => total + line.lineTotal, 0)
  const visibleOrders =
    ordersUserId === user?.id && isApprovedMember && isSupabaseConfigured ? orders : []
  const selectedGallery = getProductGallery(selectedProduct)
  const activeGalleryIndex = Math.min(
    selectedGalleryIndex,
    Math.max(selectedGallery.length - 1, 0),
  )
  const activeGalleryItem = selectedGallery[activeGalleryIndex]

  useEffect(() => {
    if (!selectedProduct) return undefined

    const handleGalleryKeyDown = (event) => {
      if (selectedGallery.length > 1 && event.key === 'ArrowLeft') {
        event.preventDefault()
        setSelectedGalleryIndex((current) => (current - 1 + selectedGallery.length) % selectedGallery.length)
      }
      if (selectedGallery.length > 1 && event.key === 'ArrowRight') {
        event.preventDefault()
        setSelectedGalleryIndex((current) => (current + 1) % selectedGallery.length)
      }
      if (event.key === 'Escape') {
        setSelectedProduct(null)
      }
    }

    window.addEventListener('keydown', handleGalleryKeyDown)
    return () => window.removeEventListener('keydown', handleGalleryKeyDown)
  }, [selectedGallery.length, selectedProduct])

  const openProduct = (product) => {
    setSelectedProduct(product)
    setSelectedVariantId(getAvailableVariant(product)?.id || '')
    setSelectedGalleryIndex(0)
    setCheckoutError('')
  }

  const shiftGallery = (direction) => {
    if (selectedGallery.length < 2) return
    setSelectedGalleryIndex(
      (current) => (current + direction + selectedGallery.length) % selectedGallery.length,
    )
  }

  const handleGalleryTouchStart = (event) => {
    event.currentTarget.dataset.touchStartX = String(event.changedTouches[0]?.clientX ?? '')
  }

  const handleGalleryTouchEnd = (event) => {
    const startX = Number(event.currentTarget.dataset.touchStartX)
    const endX = event.changedTouches[0]?.clientX
    if (!Number.isFinite(startX) || !Number.isFinite(endX) || Math.abs(endX - startX) < 42) return
    shiftGallery(endX < startX ? 1 : -1)
    delete event.currentTarget.dataset.touchStartX
  }

  const addToCart = () => {
    const variant = getProductVariant(selectedProduct, selectedVariantId)
    if (!selectedProduct || !variant || selectedProduct.status !== 'published') return
    if (variant.stock < 1) {
      setCheckoutError('That size is currently out of stock.')
      return
    }

    setCart((current) => {
      const existing = current.find(
        (entry) => entry.productId === selectedProduct.id && entry.variantId === variant.id,
      )
      if (existing) {
        return current.map((entry) =>
          entry.productId === selectedProduct.id && entry.variantId === variant.id
            ? { ...entry, quantity: Math.min(10, variant.stock, entry.quantity + 1) }
            : entry,
        )
      }

      return [
        ...current,
        { productId: selectedProduct.id, variantId: variant.id, quantity: 1 },
      ]
    })
    setSelectedProduct(null)
    setIsCartOpen(true)
    setCheckoutError('')
  }

  const updateCartQuantity = (line, nextQuantity) => {
    if (nextQuantity < 1) {
      setCart((current) =>
        current.filter(
          (entry) => !(entry.productId === line.product.id && entry.variantId === line.variant.id),
        ),
      )
      return
    }

    setCart((current) =>
      current.map((entry) =>
        entry.productId === line.product.id && entry.variantId === line.variant.id
          ? { ...entry, quantity: Math.min(10, line.variant.stock, nextQuantity) }
          : entry,
      ),
    )
  }

  const startCheckout = () => {
    setCheckoutError('')
    setCheckoutForm((current) => ({
      ...current,
      customerName: current.customerName || customerFullName,
    }))
    setIsCartOpen(false)
    setIsCheckoutOpen(true)
  }

  const updateCheckoutField = (field) => (event) => {
    const value = event.target.value
    setCheckoutForm((current) => ({
      ...current,
      [field]: value,
    }))
    setCheckoutError('')
  }

  const submitCheckout = async (event) => {
    event.preventDefault()
    setCheckoutError('')

    if (!user) {
      setCheckoutError('Sign in before placing a merchandise order.')
      return
    }
    if (!isApprovedMember) {
      setCheckoutError('Your account must be approved before placing an order.')
      return
    }
    if (cartLines.length === 0) {
      setCheckoutError('Your cart is empty.')
      return
    }
    if (!checkoutForm.customerName.trim() || checkoutForm.customerName.trim().length < 2) {
      setCheckoutError('Enter the name for this order.')
      return
    }
    if (checkoutForm.contactNumber.trim().length < 7) {
      setCheckoutError('Enter a valid contact number.')
      return
    }
    setIsSubmitting(true)
    const { data, error } = await createMerchandiseOrder(cartLines, checkoutForm)
    setIsSubmitting(false)

    if (error) {
      setCheckoutError(
        error.message?.toLowerCase().includes('stock')
          ? 'One item changed stock while you were checking out. Refresh your cart and try again.'
          : error.message || 'Checkout could not be completed. Please try again.',
      )
      return
    }

    const order = Array.isArray(data) ? data[0] : data
    setCart([])
    setIsCheckoutOpen(false)
    setConfirmation({
      orderNumber: order?.order_number || 'Order received',
      subtotal: Number(order?.subtotal) || cartTotal,
    })
    setCheckoutForm(emptyCheckoutForm)

    if (user?.id) {
      const historyResult = await getMyMerchandiseOrders(user.id)
      if (!historyResult.error) {
        setOrders(historyResult.data || [])
        setOrdersUserId(user.id)
      }
    }
  }

  return (
    <>
      <main className="merch-page pt-[84px]">
        <PageHero
          eyebrow="Official chapter store"
          title="Wear the chapter story."
          description="Shop the current ICpEP.SE collection, choose your size, and revisit the designs that marked earlier batches."
          icon={ShoppingBag}
          accentIcon={Sparkles}
          actions={
            <>
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="primary-button motion-button"
              >
                <ShoppingBag size={18} aria-hidden="true" />
                Cart {cartCount > 0 ? `(${cartCount})` : ''}
              </button>
              <a href="#catalog" className="secondary-button motion-button">
                Browse collection
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </>
          }
        />

        <section id="catalog" className="scroll-mt-24 bg-slate-50/70 py-20 sm:py-24">
          <div className="section-shell">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
                  Shop by chapter
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                  The collection
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  See what is available now or browse older batch designs. Product prices and stock are checked again when an order is placed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-navy-900 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-navy-800 lg:self-auto"
              >
                <ShoppingBag size={17} aria-hidden="true" />
                View cart {cartCount > 0 && `(${cartCount})`}
              </button>
            </div>

            <div className="merch-toolbar mt-10">
              <label className="merch-search-field">
                <Search size={18} aria-hidden="true" />
                <span className="sr-only">Search merchandise</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search designs, batches, or categories"
                />
              </label>
              <div className="merch-view-tabs" role="tablist" aria-label="Merchandise collections">
                {[
                  ['all', 'All designs'],
                  ['current', 'Current drop'],
                  ['archive', 'Batch archive'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={collectionView === value}
                    onClick={() => setCollectionView(value)}
                    className={collectionView === value ? 'merch-view-tab merch-view-tab-active' : 'merch-view-tab'}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="merch-batch-select">
                <span className="sr-only">Filter by batch</span>
                <select value={selectedBatch} onChange={(event) => setSelectedBatch(event.target.value)}>
                  {batches.map((batch) => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </label>
            </div>

            {needsSchema && (
              <div className="merch-setup-note mt-8">
                <Archive size={20} aria-hidden="true" />
                <div>
                  <p className="font-extrabold text-navy-900">The shop is being prepared</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">The merchandise catalog will appear here once the organization publishes its first collection.</p>
                </div>
              </div>
            )}

            {isLoading ? (
              <ContentSkeleton count={4} columns={4} media className="mt-10" label="Loading merchandise" />
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                icon={collectionView === 'archive' ? Archive : Shirt}
                compact
                className="mt-10"
                title={loadError || 'No designs match this view'}
                description={
                  loadError
                    ? 'Please check back after the merchandise catalog has been connected.'
                    : 'Try another batch, search term, or collection filter.'
                }
              />
            ) : (
              <>
                {collectionView !== 'archive' && currentProducts.length > 0 && (
                  <div className="mt-10 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">Available now</p>
                      <h3 className="mt-2 text-2xl font-black text-navy-900">Current batch collection</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{currentProducts.length} designs</span>
                  </div>
                )}
                <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onOpen={openProduct} />
                  ))}
                </div>
              </>
            )}

            {!isSupabaseConfigured && (
              <p className="mt-7 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-800">
                Demo catalog preview: connect Supabase and publish real products from the admin dashboard to enable checkout.
              </p>
            )}
          </div>
        </section>

        {user && isApprovedMember && isSupabaseConfigured && <OrderHistory orders={visibleOrders} />}
        {ordersError && user && isApprovedMember && isSupabaseConfigured && (
          <p className="section-shell bg-white pb-10 text-sm font-bold text-red-600">{ordersError}</p>
        )}

        <section className="bg-navy-950 py-16 text-white sm:py-20">
          <div className="section-shell grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-extrabold tracking-[0.2em] text-blue-300 uppercase">Need a hand?</p>
              <h2 className="mt-3 text-2xl font-black sm:text-3xl">Sign in to keep your order history with you.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Merchandise checkout is available to approved organization accounts so order details stay connected to the right member.
              </p>
            </div>
            {!user && (
              <Link to="/account?redirect=%2Fmerchandise" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-navy-900 transition hover:-translate-y-0.5 hover:bg-blue-50">
                Sign in or sign up <UserRound size={17} aria-hidden="true" />
              </Link>
            )}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {selectedProduct && (
          <Motion.div
            className="merch-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setSelectedProduct(null)}
          >
            <Motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="merchandise-product-title"
              className="merch-modal merch-product-modal"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <button type="button" onClick={() => setSelectedProduct(null)} className="merch-modal-close" aria-label="Close product details">
                <X size={20} aria-hidden="true" />
              </button>
              <div className="merch-product-modal-grid">
                <div className="merch-product-modal-image">
                  <div
                    id="merch-gallery-stage"
                    className="merch-product-gallery-stage"
                    role="group"
                    aria-roledescription="carousel"
                    aria-label={`${selectedProduct.name} product designs`}
                    aria-live="polite"
                    onTouchStart={handleGalleryTouchStart}
                    onTouchEnd={handleGalleryTouchEnd}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <Motion.div
                        key={activeGalleryItem?.key || 'front'}
                        className="merch-gallery-visual"
                        initial={{ opacity: 0, scale: 0.985 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.015 }}
                        transition={{ duration: 0.18 }}
                      >
                        <ProductGalleryVisual product={selectedProduct} item={activeGalleryItem} />
                      </Motion.div>
                    </AnimatePresence>

                    {selectedGallery.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="merch-gallery-control merch-gallery-control-prev"
                          onClick={() => shiftGallery(-1)}
                          aria-label={`Show ${selectedGallery[(activeGalleryIndex - 1 + selectedGallery.length) % selectedGallery.length].label.toLowerCase()}`}
                        >
                          <ChevronLeft size={21} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="merch-gallery-control merch-gallery-control-next"
                          onClick={() => shiftGallery(1)}
                          aria-label={`Show ${selectedGallery[(activeGalleryIndex + 1) % selectedGallery.length].label.toLowerCase()}`}
                        >
                          <ChevronRight size={21} aria-hidden="true" />
                        </button>
                        <div className="merch-gallery-meta">
                          <span>{activeGalleryItem?.label}</span>
                          <strong>{activeGalleryIndex + 1} / {selectedGallery.length}</strong>
                        </div>
                      </>
                    )}
                  </div>

                  {selectedGallery.length > 1 && (
                    <div className="merch-gallery-thumbnails" role="tablist" aria-label="Product designs">
                      {selectedGallery.map((item, index) => (
                        <button
                          key={item.key}
                          type="button"
                          role="tab"
                          aria-selected={activeGalleryIndex === index}
                          aria-controls="merch-gallery-stage"
                          className={`merch-gallery-thumbnail ${activeGalleryIndex === index ? 'merch-gallery-thumbnail-active' : ''}`}
                          onClick={() => setSelectedGalleryIndex(index)}
                          aria-label={`View ${item.label.toLowerCase()}`}
                        >
                          <span className="merch-gallery-thumbnail-image">
                            <ProductGalleryVisual product={selectedProduct} item={item} compact />
                          </span>
                          <span>{item.label.replace(' design', '')}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <span className="merch-batch-label">{selectedProduct.batch}</span>
                    <span className="text-xs font-bold text-slate-400">{selectedProduct.category}</span>
                  </div>
                  <h2 id="merchandise-product-title" className="mt-4 text-3xl font-black tracking-tight text-navy-900">{selectedProduct.name}</h2>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{selectedProduct.description || 'Official ICpEP.SE chapter merchandise.'}</p>
                  <div className="mt-6 flex items-end justify-between gap-4 border-y border-slate-100 py-5">
                    <div>
                      <p className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">Price</p>
                      <p className="mt-1 text-2xl font-black text-navy-900">{formatMerchandisePrice(selectedProduct.price)}</p>
                    </div>
                    <span className={`text-xs font-extrabold ${selectedProduct.totalStock > 0 && selectedProduct.status === 'published' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {selectedProduct.status === 'archived' ? 'Archive only' : selectedProduct.totalStock > 0 ? `${selectedProduct.totalStock} in stock` : 'Sold out'}
                    </span>
                  </div>

                  {selectedProduct.status === 'published' && selectedProduct.variants.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs font-extrabold tracking-[0.16em] text-navy-900 uppercase">Choose size</p>
                        <span className="text-xs font-bold text-slate-400">One item per selection</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedProduct.variants.map((variant) => (
                          <button
                            key={variant.id}
                            type="button"
                            disabled={variant.stock < 1}
                            onClick={() => setSelectedVariantId(variant.id)}
                            className={`merch-variant-button ${selectedVariantId === variant.id ? 'merch-variant-button-active' : ''}`}
                          >
                            {variant.size}
                            {variant.stock < 1 && <span className="ml-1 text-[10px] opacity-60">out</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {checkoutError && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{checkoutError}</p>}

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    {selectedProduct.status === 'published' && selectedProduct.totalStock > 0 ? (
                      <button type="button" onClick={addToCart} className="primary-button motion-button flex-1 justify-center">
                        <ShoppingBag size={17} aria-hidden="true" /> Add to cart
                      </button>
                    ) : (
                      <button type="button" onClick={() => setSelectedProduct(null)} className="secondary-button motion-button flex-1 justify-center">
                        <Archive size={17} aria-hidden="true" /> Return to archive
                      </button>
                    )}
                    <button type="button" onClick={() => setSelectedProduct(null)} className="secondary-button motion-button justify-center">Close</button>
                  </div>
                </div>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <Motion.div className="merch-drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => setIsCartOpen(false)}>
            <Motion.aside className="merch-drawer" role="dialog" aria-modal="true" aria-labelledby="merch-cart-title" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }} onMouseDown={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">Your selection</p>
                  <h2 id="merch-cart-title" className="mt-2 text-2xl font-black text-navy-900">Shopping cart</h2>
                  <p className="mt-1 text-xs text-slate-500">{cartCount} item{cartCount === 1 ? '' : 's'} selected</p>
                </div>
                <button type="button" onClick={() => setIsCartOpen(false)} className="merch-modal-close static" aria-label="Close shopping cart"><X size={20} aria-hidden="true" /></button>
              </div>

              <div className="merch-drawer-content">
                {cartLines.length === 0 ? (
                  <div className="grid min-h-[18rem] place-items-center px-7 text-center">
                    <div>
                      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><ShoppingBag size={25} aria-hidden="true" /></span>
                      <h3 className="mt-5 text-xl font-black text-navy-900">Your cart is waiting</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Choose a current design and size to start your order.</p>
                      <button type="button" onClick={() => setIsCartOpen(false)} className="primary-button motion-button mt-6">Browse designs <ArrowRight size={16} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 px-5 py-5 sm:px-7">
                    {cartLines.map((line) => (
                      <article key={`${line.product.id}-${line.variant.id}`} className="merch-cart-line">
                        <div className="merch-cart-line-image"><ProductImage product={line.product} compact /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-black text-navy-900">{line.product.name}</h3>
                              <p className="mt-1 text-xs font-bold text-slate-500">{line.product.batch} · {line.variant.size}</p>
                            </div>
                            <button type="button" onClick={() => updateCartQuantity(line, 0)} className="text-xs font-extrabold text-slate-400 hover:text-red-600" aria-label={`Remove ${line.product.name}`}>Remove</button>
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="merch-quantity-control">
                              <button type="button" onClick={() => updateCartQuantity(line, line.quantity - 1)} aria-label="Decrease quantity"><Minus size={14} /></button>
                              <span>{line.quantity}</span>
                              <button type="button" onClick={() => updateCartQuantity(line, line.quantity + 1)} disabled={line.quantity >= Math.min(10, line.variant.stock)} aria-label="Increase quantity"><Plus size={14} /></button>
                            </div>
                            <span className="text-sm font-black text-navy-900">{formatMerchandisePrice(line.lineTotal)}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              {cartLines.length > 0 && (
                <div className="border-t border-slate-200 px-5 py-5 sm:px-7">
                  <div className="flex items-center justify-between gap-4"><span className="text-sm font-bold text-slate-500">Subtotal</span><span className="text-2xl font-black text-navy-900">{formatMerchandisePrice(cartTotal)}</span></div>
                  {!isSupabaseConfigured ? (
                    <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs font-bold leading-5 text-amber-800">Connect the live Supabase catalog before placing orders.</p>
                  ) : !user ? (
                    <Link to="/account?redirect=%2Fmerchandise" onClick={() => setIsCartOpen(false)} className="primary-button motion-button mt-5 flex w-full justify-center"><LockKeyhole size={16} /> Sign in to checkout</Link>
                  ) : !isApprovedMember ? (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs font-bold leading-5 text-amber-800">Your account must be approved before checkout is available.</div>
                  ) : (
                    <button type="button" onClick={startCheckout} className="primary-button motion-button mt-5 flex w-full justify-center"><PackageCheck size={16} /> Continue to checkout</button>
                  )}
                  <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">Stock and prices are confirmed by the database when you place the order.</p>
                </div>
              )}
            </Motion.aside>
          </Motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCheckoutOpen && (
          <Motion.div className="merch-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => !isSubmitting && setIsCheckoutOpen(false)}>
            <Motion.div className="merch-modal merch-checkout-modal" role="dialog" aria-modal="true" aria-labelledby="merch-checkout-title" initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} onMouseDown={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
                <div><p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">Order request</p><h2 id="merch-checkout-title" className="mt-2 text-2xl font-black text-navy-900">Checkout</h2><p className="mt-1 text-xs text-slate-500">Signed in as {user?.email}</p></div>
                <button type="button" onClick={() => !isSubmitting && setIsCheckoutOpen(false)} className="merch-modal-close static" aria-label="Close checkout"><X size={20} /></button>
              </div>
              <form onSubmit={submitCheckout} className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_0.72fr]">
                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="merch-form-label sm:col-span-2">Customer full name<input name="customerName" value={checkoutForm.customerName} onChange={updateCheckoutField('customerName')} required maxLength={120} autoComplete="name" placeholder="Enter your full name" /></label>
                    <label className="merch-form-label sm:col-span-2">Contact number<input name="contactNumber" type="tel" value={checkoutForm.contactNumber} onChange={updateCheckoutField('contactNumber')} required maxLength={40} placeholder="09xx xxx xxxx" /></label>
                  </div>
                  <fieldset>
                    <legend className="text-xs font-extrabold tracking-[0.16em] text-navy-900 uppercase">Campus collection</legend>
                    <div className="merch-choice-card merch-choice-card-active merch-collection-note mt-3">
                      <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-600"><PackageCheck size={17} /></span>
                      <span><strong>Personal campus handover</strong><small>We compile requests before production, then hand your order to you on campus when the batch is ready.</small></span>
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend className="text-xs font-extrabold tracking-[0.16em] text-navy-900 uppercase">Payment method</legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {[
                        ['cash_on_pickup', 'Cash on pickup'],
                        ['bank_transfer', 'Bank transfer'],
                        ['e_wallet', 'E-wallet'],
                      ].map(([value, label]) => (
                        <label key={value} className={`merch-payment-option ${checkoutForm.paymentMethod === value ? 'merch-payment-option-active' : ''}`}><input type="radio" name="paymentMethod" value={value} checked={checkoutForm.paymentMethod === value} onChange={updateCheckoutField('paymentMethod')} /><CreditCard size={16} /><span>{label}</span></label>
                      ))}
                    </div>
                  </fieldset>
                  <label className="merch-form-label">Order note <span className="font-normal text-slate-400">(optional)</span><textarea name="notes" value={checkoutForm.notes} onChange={updateCheckoutField('notes')} rows="3" maxLength={500} placeholder="Sizing note or pickup reminder" /></label>
                  {checkoutError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">{checkoutError}</p>}
                </div>
                <aside className="merch-checkout-summary">
                  <p className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">Order summary</p>
                  <div className="mt-4 space-y-3">
                    {cartLines.map((line) => <div key={`${line.product.id}-${line.variant.id}`} className="flex justify-between gap-3 text-sm"><span className="min-w-0 truncate text-slate-600">{line.quantity} x {line.product.name} ({line.variant.size})</span><span className="shrink-0 font-extrabold text-navy-900">{formatMerchandisePrice(line.lineTotal)}</span></div>)}
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-200 pt-5"><span className="font-bold text-slate-500">Total</span><span className="text-2xl font-black text-navy-900">{formatMerchandisePrice(cartTotal)}</span></div>
                  <p className="mt-4 text-xs leading-5 text-slate-500">No payment is collected by this form. Requests are compiled before production, and the organization will confirm payment instructions and your campus handover schedule.</p>
                  <button type="submit" disabled={isSubmitting} className="primary-button motion-button mt-6 flex w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? <Clock3 size={17} className="animate-pulse" /> : <Check size={17} />} {isSubmitting ? 'Placing order...' : 'Place order request'}</button>
                </aside>
              </form>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmation && (
          <Motion.div className="merch-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Motion.div className="merch-modal merch-confirmation-modal p-7 text-center sm:p-10" role="dialog" aria-modal="true" aria-labelledby="merch-confirmation-title" initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}>
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={34} /></span>
              <p className="mt-6 text-xs font-extrabold tracking-[0.18em] text-emerald-600 uppercase">Order received</p>
              <h2 id="merch-confirmation-title" className="mt-2 text-3xl font-black text-navy-900">Your request is in.</h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-600">Keep this order number for reference. Your request will be compiled with the batch, and the organization will confirm payment instructions and when to collect it on campus.</p>
              <div className="merch-confirmation-number mt-6"><span>Order number</span><strong>{confirmation.orderNumber}</strong><small>{formatMerchandisePrice(confirmation.subtotal)} total</small></div>
              <button type="button" onClick={() => setConfirmation(null)} className="primary-button motion-button mt-7 w-full justify-center">Continue browsing <ArrowRight size={16} /></button>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Merchandise
