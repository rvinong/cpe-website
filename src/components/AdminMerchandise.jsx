import {
  Archive,
  CheckCircle2,
  CirclePlus,
  Edit3,
  Image as ImageIcon,
  LoaderCircle,
  PackageCheck,
  Plus,
  Save,
  ShoppingBag,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import {
  createMerchandiseProduct,
  deleteMerchandiseOrder,
  deleteMerchandiseProduct,
  formatMerchandiseOrderDate,
  formatMerchandisePrice,
  getAdminMerchandiseOrders,
  getAdminMerchandiseProducts,
  getMerchandiseImageUrl,
  isMerchandiseSchemaMissing,
  replaceMerchandiseVariants,
  updateMerchandiseOrderStatus,
  updateMerchandiseProduct,
} from '../lib/merchandise'
import {
  removeMedia,
  uploadMedia,
  validateMediaFile,
} from '../lib/media'

const defaultVariants = [
  { size: 'S', stock: 0 },
  { size: 'M', stock: 0 },
  { size: 'L', stock: 0 },
  { size: 'XL', stock: 0 },
]

const emptyForm = {
  name: '',
  batch: '',
  category: 'Shirts',
  description: '',
  price: '',
  status: 'draft',
  isFeatured: false,
  sortOrder: 0,
  imageAlt: '',
  frontImagePath: '',
  backImagePath: '',
  variants: defaultVariants,
}

const orderStatusOptions = [
  ['pending', 'Pending review'],
  ['confirmed', 'Confirmed'],
  ['ready', 'Ready for pickup'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
]

const statusStyles = {
  draft: 'bg-amber-50 text-amber-700 ring-amber-200',
  published: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  archived: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const orderStatusStyles = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 ring-blue-200',
  ready: 'bg-violet-50 text-violet-700 ring-violet-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

const inputClassName = 'admin-field mt-2 placeholder:text-slate-400'

function copyVariants(variants = defaultVariants) {
  return variants.map((variant) => ({
    size: variant.size || '',
    stock: Number(variant.stock) || 0,
  }))
}

function ProductThumbnail({ product, className = '' }) {
  const imageUrl = getMerchandiseImageUrl(product.front_image_path)

  return (
    <div className={`admin-merch-thumbnail ${className}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={product.image_alt || `${product.name} image`} />
      ) : (
        <>
          <ShoppingBag size={27} aria-hidden="true" />
          <span>{product.batch || 'ICpEP.SE'}</span>
        </>
      )}
    </div>
  )
}

function AdminMerchandise() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('products')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [frontPreview, setFrontPreview] = useState('')
  const [backPreview, setBackPreview] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [needsSchema, setNeedsSchema] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState('')

  useBodyScrollLock(isEditorOpen)

  const loadMerchandise = useCallback(async () => {
    setIsLoading(true)
    const [productResult, orderResult] = await Promise.all([
      getAdminMerchandiseProducts(),
      getAdminMerchandiseOrders(),
    ])

    if (productResult.error) {
      setError(productResult.error.message)
      setNeedsSchema(isMerchandiseSchemaMissing(productResult.error))
    } else {
      setProducts(productResult.data || [])
      setError('')
      setNeedsSchema(false)
    }

    if (!orderResult.error) {
      setOrders(orderResult.data || [])
    } else if (!productResult.error) {
      setError(orderResult.error.message)
      setNeedsSchema(isMerchandiseSchemaMissing(orderResult.error))
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true

    Promise.all([getAdminMerchandiseProducts(), getAdminMerchandiseOrders()]).then(
      ([productResult, orderResult]) => {
        if (!isMounted) return

        if (productResult.error) {
          setError(productResult.error.message)
          setNeedsSchema(isMerchandiseSchemaMissing(productResult.error))
        } else {
          setProducts(productResult.data || [])
          setNeedsSchema(false)
        }

        if (!orderResult.error) {
          setOrders(orderResult.data || [])
        } else if (!productResult.error) {
          setError(orderResult.error.message)
          setNeedsSchema(isMerchandiseSchemaMissing(orderResult.error))
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
      if (frontPreview.startsWith('blob:')) URL.revokeObjectURL(frontPreview)
    },
    [frontPreview],
  )

  useEffect(
    () => () => {
      if (backPreview.startsWith('blob:')) URL.revokeObjectURL(backPreview)
    },
    [backPreview],
  )

  const counts = useMemo(
    () => ({
      products: products.length,
      published: products.filter((product) => product.status === 'published').length,
      archived: products.filter((product) => product.status === 'archived').length,
      orders: orders.filter((order) => order.status !== 'completed' && order.status !== 'cancelled').length,
    }),
    [orders, products],
  )

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return products

    return products.filter((product) =>
      [product.name, product.batch, product.category, product.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }, [products, searchTerm])

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return orders

    return orders.filter((order) =>
      [order.order_number, order.customer_name, order.customer_email, order.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }, [orders, searchTerm])

  const clearPreviews = () => {
    setFrontFile(null)
    setBackFile(null)
    setFrontPreview('')
    setBackPreview('')
  }

  const closeEditor = (force = false) => {
    if (isSaving && !force) return
    setIsEditorOpen(false)
    setEditingProduct(null)
    setForm(emptyForm)
    clearPreviews()
  }

  const openEditor = (product = null) => {
    setEditingProduct(product)
    setForm(
      product
        ? {
            name: product.name,
            batch: product.batch,
            category: product.category,
            description: product.description,
            price: String(product.price),
            status: product.status,
            isFeatured: product.is_featured,
            sortOrder: product.sort_order,
            imageAlt: product.image_alt || '',
            frontImagePath: product.front_image_path || '',
            backImagePath: product.back_image_path || '',
            variants: copyVariants(product.variants),
          }
        : { ...emptyForm, variants: copyVariants() },
    )
    setFrontFile(null)
    setBackFile(null)
    setFrontPreview(product ? getMerchandiseImageUrl(product.front_image_path) : '')
    setBackPreview(product ? getMerchandiseImageUrl(product.back_image_path) : '')
    setError('')
    setSuccess('')
    setIsEditorOpen(true)
  }

  const updateField = (event) => {
    const { name, type, checked, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setError('')
  }

  const handleImageChange = (field, event) => {
    const file = event.target.files?.[0] || null
    if (!file) return

    const fileError = validateMediaFile(file)
    if (fileError) {
      setError(fileError)
      event.target.value = ''
      return
    }

    const preview = URL.createObjectURL(file)
    if (field === 'front') {
      setFrontFile(file)
      setFrontPreview(preview)
    } else {
      setBackFile(file)
      setBackPreview(preview)
    }
    setError('')
    event.target.value = ''
  }

  const clearImage = (field) => {
    if (field === 'front') {
      setFrontFile(null)
      setFrontPreview('')
      setForm((current) => ({ ...current, frontImagePath: '' }))
    } else {
      setBackFile(null)
      setBackPreview('')
      setForm((current) => ({ ...current, backImagePath: '' }))
    }
  }

  const updateVariant = (index, field, value) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index
          ? { ...variant, [field]: field === 'stock' ? value : value }
          : variant,
      ),
    }))
  }

  const addVariant = () => {
    setForm((current) => ({
      ...current,
      variants: [...current.variants, { size: '', stock: 0 }],
    }))
  }

  const removeVariant = (index) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.filter((_, variantIndex) => variantIndex !== index),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const normalizedVariants = form.variants
      .map((variant) => ({
        size: variant.size.trim(),
        stock: Number(variant.stock) || 0,
      }))
      .filter((variant) => variant.size)
    const normalizedSizes = normalizedVariants.map((variant) => variant.size.toLowerCase())

    if (!form.name.trim() || !form.batch.trim()) {
      setError('Product name and batch are required.')
      return
    }
    if (form.price === '' || !Number.isFinite(Number(form.price)) || Number(form.price) < 0) {
      setError('Enter a valid product price.')
      return
    }
    if (normalizedVariants.length === 0) {
      setError('Add at least one size or variant.')
      return
    }
    if (new Set(normalizedSizes).size !== normalizedSizes.length) {
      setError('Each size or variant must be unique.')
      return
    }
    if (!form.imageAlt.trim() && (frontFile || frontPreview || backFile || backPreview)) {
      setError('Add a short description for the product images.')
      return
    }

    setIsSaving(true)
    const uploadedPaths = []
    let frontImagePath = form.frontImagePath || null
    let backImagePath = form.backImagePath || null

    if (frontFile) {
      const uploadResult = await uploadMedia(frontFile, 'merchandise')
      if (uploadResult.error) {
        setError(uploadResult.error.message)
        setIsSaving(false)
        return
      }
      frontImagePath = uploadResult.data.path
      uploadedPaths.push(frontImagePath)
    }

    if (backFile) {
      const uploadResult = await uploadMedia(backFile, 'merchandise')
      if (uploadResult.error) {
        await Promise.all(uploadedPaths.map((path) => removeMedia(path)))
        setError(uploadResult.error.message)
        setIsSaving(false)
        return
      }
      backImagePath = uploadResult.data.path
      uploadedPaths.push(backImagePath)
    }

    const result = editingProduct
      ? await updateMerchandiseProduct(editingProduct.id, form, {
          frontImagePath,
          backImagePath,
        })
      : await createMerchandiseProduct(form, {
          frontImagePath,
          backImagePath,
        })

    if (result.error) {
      await Promise.all(uploadedPaths.map((path) => removeMedia(path)))
      setError(result.error.message)
      setNeedsSchema(isMerchandiseSchemaMissing(result.error))
      setIsSaving(false)
      return
    }

    const variantResult = await replaceMerchandiseVariants(result.data.id, normalizedVariants)
    if (variantResult.error) {
      if (!editingProduct) {
        await deleteMerchandiseProduct(result.data.id)
        await Promise.all(uploadedPaths.map((path) => removeMedia(path)))
      }
      setError(variantResult.error.message)
      setNeedsSchema(isMerchandiseSchemaMissing(variantResult.error))
      setIsSaving(false)
      return
    }

    if (editingProduct) {
      const oldPaths = [editingProduct.front_image_path, editingProduct.back_image_path]
      const savedPaths = new Set([frontImagePath, backImagePath].filter(Boolean))
      await Promise.all(
        oldPaths
          .filter((path) => path && !savedPaths.has(path))
          .map((path) => removeMedia(path)),
      )
    }

    setSuccess(editingProduct ? 'Merchandise product updated.' : 'Merchandise product created.')
    setIsSaving(false)
    closeEditor(true)
    await loadMerchandise()
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}" permanently? Existing orders will keep their item snapshot.`)) return

    setError('')
    const { error: deleteError } = await deleteMerchandiseProduct(product.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    await Promise.all(
      [product.front_image_path, product.back_image_path]
        .filter(Boolean)
        .map((path) => removeMedia(path)),
    )
    setSuccess('Merchandise product deleted.')
    await loadMerchandise()
  }

  const handleOrderStatusChange = async (order, status) => {
    if (status === order.status) return
    setUpdatingOrderId(order.id)
    setError('')
    const { error: updateError } = await updateMerchandiseOrderStatus(order.id, status)
    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(`Order ${order.order_number} updated.`)
      await loadMerchandise()
    }
    setUpdatingOrderId('')
  }

  const handleDeleteOrder = async (order) => {
    const shouldDelete = window.confirm(
      `Delete order ${order.order_number} permanently? Unfinished item stock will be returned.`,
    )
    if (!shouldDelete) return

    setUpdatingOrderId(order.id)
    setError('')
    const { error: deleteError } = await deleteMerchandiseOrder(order.id)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      setSuccess(`Order ${order.order_number} deleted.`)
      await loadMerchandise()
    }
    setUpdatingOrderId('')
  }

  return (
    <div className="admin-page mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">Chapter store management</p>
          <h2 className="mt-2 text-3xl font-black text-navy-900">Merchandise</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Publish batch designs, keep size stock accurate, and process member order requests from one workspace.</p>
        </div>
        <button type="button" onClick={() => openEditor()} disabled={needsSchema} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"><CirclePlus size={18} /> New product</button>
      </div>

      {needsSchema && (
        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-extrabold text-amber-900">One database step is still required</p>
          <p className="mt-2 text-sm leading-6 text-amber-800">Open the Supabase SQL Editor and run <code className="rounded bg-white px-1.5 py-1 font-bold">supabase/merchandise.sql</code>, then refresh this dashboard.</p>
        </div>
      )}

      {(error || success) && !needsSchema && <div className={`mt-7 rounded-xl border px-4 py-3 text-sm font-bold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`} role="status">{error || success}</div>}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Catalog items', counts.products, ShoppingBag],
          ['Published', counts.published, CheckCircle2],
          ['Batch archive', counts.archived, Archive],
          ['Open orders', counts.orders, PackageCheck],
        ].map(([label, value, Icon]) => <article key={label} className="surface-card p-5"><div className="flex items-center justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon size={19} /></span><span className="text-3xl font-black text-navy-900">{value}</span></div><p className="mt-4 text-xs font-extrabold tracking-wide text-slate-500 uppercase">{label}</p></article>)}
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex gap-2" role="tablist" aria-label="Merchandise management views">
            <button type="button" role="tab" aria-selected={activeTab === 'products'} onClick={() => setActiveTab('products')} className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${activeTab === 'products' ? 'bg-brand-600 text-white' : 'border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'}`}>Products</button>
            <button type="button" role="tab" aria-selected={activeTab === 'orders'} onClick={() => setActiveTab('orders')} className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${activeTab === 'orders' ? 'bg-brand-600 text-white' : 'border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'}`}>Orders {counts.orders > 0 && <span className="ml-1">({counts.orders})</span>}</button>
          </div>
          <label className="relative block sm:w-72"><span className="sr-only">Search merchandise</span><input className="admin-search-field" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={activeTab === 'products' ? 'Search products or batches' : 'Search orders or members'} /></label>
        </div>

        {isLoading ? <div className="p-7 text-sm font-bold text-slate-500">Loading merchandise workspace...</div> : activeTab === 'products' ? (
          filteredProducts.length === 0 ? <div className="p-7 text-sm font-bold text-slate-500">No merchandise products have been added yet.</div> : <div className="divide-y divide-slate-200">{filteredProducts.map((product) => <article key={product.id} className="grid gap-4 px-5 py-5 sm:grid-cols-[5rem_1fr_auto] sm:items-center sm:px-6"><ProductThumbnail product={product} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ring-1 ${statusStyles[product.status] || statusStyles.draft}`}>{product.status}</span><span className="text-xs font-bold text-slate-400">{product.batch}</span>{product.is_featured && <span className="text-xs font-extrabold text-brand-600">Featured</span>}</div><h3 className="mt-2 text-lg font-black text-navy-900">{product.name}</h3><p className="mt-1 text-sm text-slate-500">{formatMerchandisePrice(product.price)} · {product.category} · {product.totalStock} total stock</p><div className="mt-2 flex flex-wrap gap-1.5">{product.variants.map((variant) => <span key={variant.id} className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{variant.size}: {variant.stock}</span>)}</div></div><div className="flex gap-2 sm:justify-end"><button type="button" onClick={() => openEditor(product)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-extrabold text-slate-600 transition hover:border-brand-400 hover:text-brand-600"><Edit3 size={15} /> Edit</button><button type="button" onClick={() => handleDelete(product)} className="grid size-10 place-items-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50" aria-label={`Delete ${product.name}`}><Trash2 size={16} /></button></div></article>)}</div>
        ) : (
          filteredOrders.length === 0 ? <div className="p-7 text-sm font-bold text-slate-500">No merchandise orders have been submitted yet.</div> : <div className="divide-y divide-slate-200">{filteredOrders.map((order) => <article key={order.id} className="px-5 py-5 sm:px-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-extrabold tracking-[0.16em] text-brand-600 uppercase">{order.order_number}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ring-1 ${orderStatusStyles[order.status] || orderStatusStyles.pending}`}>{order.status}</span></div><h3 className="mt-2 text-lg font-black text-navy-900">{order.customer_name}</h3><p className="mt-1 text-xs text-slate-500">{order.customer_email} · {order.contact_number} · {formatMerchandiseOrderDate(order.created_at)}</p></div><div className="flex flex-wrap items-end gap-2"><label className="text-xs font-extrabold text-slate-500">Update status<select className="admin-field mt-2 min-w-48" value={order.status} disabled={updatingOrderId === order.id} onChange={(event) => handleOrderStatusChange(order, event.target.value)}>{orderStatusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button type="button" onClick={() => handleDeleteOrder(order)} disabled={updatingOrderId === order.id} className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Delete order ${order.order_number}`}><Trash2 size={15} /> Delete</button></div></div><div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_auto] sm:items-end"><div className="space-y-2">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 text-sm"><span className="text-slate-600">{item.quantity} x {item.product_name} ({item.variant_size})</span><span className="font-extrabold text-navy-900">{formatMerchandisePrice(item.line_total)}</span></div>)}<p className="pt-2 text-xs font-bold text-slate-400">{order.fulfillment_method === 'pickup' ? 'Campus pickup' : `Delivery: ${order.delivery_address}`}; {order.payment_method.replaceAll('_', ' ')}</p></div><div className="text-left sm:text-right"><p className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">Order total</p><p className="mt-1 text-2xl font-black text-navy-900">{formatMerchandisePrice(order.subtotal)}</p></div></div></article>)}</div>
        )}
      </section>

      {isEditorOpen && <div className="admin-modal-backdrop fixed inset-0 z-[70] overflow-y-auto bg-navy-950/70 px-3 py-5 sm:px-6 sm:py-10"><div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7"><div><p className="text-xs font-extrabold tracking-[0.18em] text-brand-600 uppercase">Catalog editor</p><h2 className="mt-2 text-2xl font-black text-navy-900">{editingProduct ? 'Edit merchandise' : 'New merchandise product'}</h2><p className="mt-1 text-sm text-slate-500">A product can be published now, saved as a draft, or preserved in the batch archive.</p></div><button type="button" onClick={closeEditor} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:border-brand-400 hover:text-brand-600" aria-label="Close product editor"><X size={19} /></button></div><form onSubmit={handleSubmit} className="p-5 sm:p-7"><div className="grid gap-5 lg:grid-cols-2"><label className="text-sm font-extrabold text-navy-900">Product name<input className={inputClassName} name="name" value={form.name} onChange={updateField} maxLength={120} required placeholder="e.g. Core Circuit Tee" /></label><label className="text-sm font-extrabold text-navy-900">Batch label<input className={inputClassName} name="batch" value={form.batch} onChange={updateField} maxLength={80} required placeholder="e.g. Batch 2026" /></label><label className="text-sm font-extrabold text-navy-900">Category<select className={inputClassName} name="category" value={form.category} onChange={updateField}><option>Shirts</option><option>Hoodies</option><option>Accessories</option><option>Other</option></select></label><label className="text-sm font-extrabold text-navy-900">Price (PHP)<input className={inputClassName} name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateField} required placeholder="450" /></label><label className="text-sm font-extrabold text-navy-900">Publication status<select className={inputClassName} name="status" value={form.status} onChange={updateField}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label className="text-sm font-extrabold text-navy-900">Display order<input className={inputClassName} name="sortOrder" type="number" min="0" value={form.sortOrder} onChange={updateField} /></label></div><label className="mt-5 block text-sm font-extrabold text-navy-900">Description<textarea className={`${inputClassName} min-h-28 resize-y`} name="description" value={form.description} onChange={updateField} maxLength={800} placeholder="Describe the design, fit, or story behind this batch." /></label><div className="mt-5 grid gap-4 lg:grid-cols-2"><div className="admin-merch-upload-card"><div className="flex items-center justify-between gap-3"><p className="text-sm font-extrabold text-navy-900">Front design</p>{frontPreview && <button type="button" onClick={() => clearImage('front')} className="text-xs font-extrabold text-red-500">Remove</button>}</div>{frontPreview ? <img src={frontPreview} alt="Front design preview" className="admin-merch-image-preview mt-3" /> : <div className="admin-merch-upload-empty mt-3"><ImageIcon size={25} /></div>}<label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-extrabold text-slate-600 hover:border-brand-400 hover:text-brand-600"><Upload size={15} /> {frontFile ? 'Replace image' : 'Choose image'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageChange('front', event)} className="sr-only" /></label></div><div className="admin-merch-upload-card"><div className="flex items-center justify-between gap-3"><p className="text-sm font-extrabold text-navy-900">Back design <span className="font-normal text-slate-400">(optional)</span></p>{backPreview && <button type="button" onClick={() => clearImage('back')} className="text-xs font-extrabold text-red-500">Remove</button>}</div>{backPreview ? <img src={backPreview} alt="Back design preview" className="admin-merch-image-preview mt-3" /> : <div className="admin-merch-upload-empty mt-3"><ImageIcon size={25} /></div>}<label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-extrabold text-slate-600 hover:border-brand-400 hover:text-brand-600"><Upload size={15} /> {backFile ? 'Replace image' : 'Choose image'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageChange('back', event)} className="sr-only" /></label></div></div><label className="mt-5 block text-sm font-extrabold text-navy-900">Image description<input className={inputClassName} name="imageAlt" value={form.imageAlt} onChange={updateField} maxLength={180} placeholder="Official Batch 2026 chapter shirt front design" /></label><div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-navy-900">Size and stock</p><p className="mt-1 text-xs leading-5 text-slate-500">Stock is rechecked by the database during checkout.</p></div><button type="button" onClick={addVariant} className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-extrabold text-brand-600 hover:bg-brand-50"><Plus size={15} /> Add variant</button></div><div className="mt-4 space-y-3">{form.variants.map((variant, index) => <div key={`${index}-${variant.size}`} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><label className="text-xs font-extrabold text-slate-500">Size / variant<input className={inputClassName} value={variant.size} onChange={(event) => updateVariant(index, 'size', event.target.value)} maxLength={16} placeholder="M or One size" /></label><label className="text-xs font-extrabold text-slate-500">Stock<input className={inputClassName} type="number" min="0" max="10000" value={variant.stock} onChange={(event) => updateVariant(index, 'stock', event.target.value)} /></label><button type="button" onClick={() => removeVariant(index)} disabled={form.variants.length <= 1} className="mt-7 grid size-11 place-items-center rounded-xl border border-red-100 text-red-500 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Remove size variant"><Trash2 size={16} /></button></div>)}</div></div><label className="mt-5 flex items-center gap-3 text-sm font-extrabold text-navy-900"><input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={updateField} className="size-4 accent-blue-600" /> Feature this design in the current collection</label>{error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}<div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end"><button type="button" onClick={closeEditor} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-extrabold text-slate-600">Cancel</button><button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">{isSaving ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />} {isSaving ? 'Saving...' : editingProduct ? 'Save changes' : 'Create product'}</button></div></form></div></div>}
    </div>
  )
}

export default AdminMerchandise
