import { getSafeAssetUrl, isSafeStoragePath } from './safeUrl'
import { isSupabaseConfigured, supabase } from './supabase'

export const merchandiseColumns = [
  'id',
  'slug',
  'name',
  'batch',
  'category',
  'description',
  'price',
  'front_image_path',
  'back_image_path',
  'image_alt',
  'status',
  'is_featured',
  'sort_order',
  'created_by',
  'created_at',
  'updated_at',
].join(', ')

export const merchandiseOrderColumns = [
  'id',
  'order_number',
  'user_id',
  'customer_name',
  'customer_email',
  'contact_number',
  'fulfillment_method',
  'payment_method',
  'delivery_address',
  'notes',
  'subtotal',
  'status',
  'created_at',
  'updated_at',
].join(', ')

const merchandiseOrderItemColumns = [
  'id',
  'order_id',
  'product_id',
  'variant_id',
  'product_name',
  'product_batch',
  'variant_size',
  'quantity',
  'unit_price',
  'line_total',
].join(', ')

export const merchandiseBucket = 'organization-media'
export const merchandiseUploadFolder = 'merchandise'

const orderStatusLabels = {
  pending: 'Pending review',
  confirmed: 'Confirmed',
  ready: 'Ready for pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function getMerchandiseImageUrl(path) {
  if (!path) return ''

  const safeAssetUrl = getSafeAssetUrl(path)
  if (safeAssetUrl) return safeAssetUrl
  if (!supabase || !isSafeStoragePath(path)) return ''

  return supabase.storage
    .from(merchandiseBucket)
    .getPublicUrl(path).data.publicUrl
}

function normalizeVariant(variant) {
  return {
    ...variant,
    size: String(variant?.size || '').trim(),
    stock: Math.max(0, Number(variant?.stock) || 0),
  }
}

export function normalizeMerchandiseProduct(row) {
  const variants = Array.isArray(row?.merchandise_variants)
    ? row.merchandise_variants.map(normalizeVariant)
    : []

  return {
    ...row,
    price: Number(row?.price) || 0,
    variants: variants.sort((first, second) => first.size.localeCompare(second.size)),
    frontImage: getMerchandiseImageUrl(row?.front_image_path),
    backImage: getMerchandiseImageUrl(row?.back_image_path),
    totalStock: variants.reduce((total, variant) => total + variant.stock, 0),
  }
}

export function normalizeMerchandiseOrder(row) {
  return {
    ...row,
    subtotal: Number(row?.subtotal) || 0,
    items: Array.isArray(row?.merchandise_order_items)
      ? row.merchandise_order_items.map((item) => ({
          ...item,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          line_total: Number(item.line_total) || 0,
        }))
      : [],
    statusLabel: orderStatusLabels[row?.status] || row?.status || 'Pending review',
  }
}

export function formatMerchandisePrice(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

export function formatMerchandiseOrderDate(value) {
  if (!value) return 'No date'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Manila',
  }).format(new Date(value))
}

export function getMerchandiseOrderStatusLabel(status) {
  return orderStatusLabels[status] || status || 'Pending review'
}

export function isMerchandiseSchemaMissing(error) {
  return ['42P01', '42703', 'PGRST200', 'PGRST204', 'PGRST205'].includes(
    error?.code,
  )
}

export async function getPublishedMerchandise() {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('merchandise_products')
    .select(`${merchandiseColumns}, merchandise_variants ( id, product_id, size, stock )`)
    .in('status', ['published', 'archived'])
    .order('status', { ascending: true })
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return {
    data: data?.map(normalizeMerchandiseProduct) || [],
    error,
  }
}

export async function getAdminMerchandiseProducts() {
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('merchandise_products')
    .select(`${merchandiseColumns}, merchandise_variants ( id, product_id, size, stock )`)
    .order('updated_at', { ascending: false })

  return {
    data: data?.map(normalizeMerchandiseProduct) || [],
    error,
  }
}

export async function getAdminMerchandiseOrders() {
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('merchandise_orders')
    .select(
      `${merchandiseOrderColumns}, merchandise_order_items ( ${merchandiseOrderItemColumns} )`,
    )
    .order('created_at', { ascending: false })

  return {
    data: data?.map(normalizeMerchandiseOrder) || [],
    error,
  }
}

export async function getMyMerchandiseOrders(userId) {
  if (!supabase || !userId) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('merchandise_orders')
    .select(
      `${merchandiseOrderColumns}, merchandise_order_items ( ${merchandiseOrderItemColumns} )`,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(12)

  return {
    data: data?.map(normalizeMerchandiseOrder) || [],
    error,
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
}

async function createAvailableSlug(name) {
  const baseSlug = slugify(name) || 'merchandise'
  const { data, error } = await supabase
    .from('merchandise_products')
    .select('slug')
    .eq('slug', baseSlug)
    .maybeSingle()

  if (error) return `${baseSlug}-${Date.now().toString(36).slice(-6)}`
  if (!data) return baseSlug

  return `${baseSlug}-${Date.now().toString(36).slice(-6)}`
}

function normalizeStoragePath(path) {
  const cleanPath = typeof path === 'string' ? path.trim() : ''
  return cleanPath && isSafeStoragePath(cleanPath) ? cleanPath : null
}

function toProductPayload(values, paths = {}) {
  return {
    name: values.name.trim(),
    batch: values.batch.trim(),
    category: values.category,
    description: values.description.trim(),
    price: Number(values.price) || 0,
    front_image_path: normalizeStoragePath(paths.frontImagePath),
    back_image_path: normalizeStoragePath(paths.backImagePath),
    image_alt: values.imageAlt.trim(),
    status: values.status,
    is_featured: Boolean(values.isFeatured),
    sort_order: Number(values.sortOrder) || 0,
  }
}

export async function createMerchandiseProduct(values, paths = {}) {
  const slug = await createAvailableSlug(values.name)

  return supabase
    .from('merchandise_products')
    .insert({
      ...toProductPayload(values, paths),
      slug,
    })
    .select(merchandiseColumns)
    .single()
}

export async function updateMerchandiseProduct(id, values, paths = {}) {
  return supabase
    .from('merchandise_products')
    .update(toProductPayload(values, paths))
    .eq('id', id)
    .select(merchandiseColumns)
    .single()
}

export async function replaceMerchandiseVariants(productId, variants) {
  const deleteResult = await supabase
    .from('merchandise_variants')
    .delete()
    .eq('product_id', productId)

  if (deleteResult.error) return deleteResult

  const payload = variants.map((variant) => ({
    product_id: productId,
    size: variant.size.trim(),
    stock: Number(variant.stock) || 0,
  }))

  return payload.length
    ? supabase.from('merchandise_variants').insert(payload)
    : { data: [], error: null }
}

export async function deleteMerchandiseProduct(id) {
  return supabase.from('merchandise_products').delete().eq('id', id)
}

export async function createMerchandiseOrder(items, values) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  return supabase.rpc('create_merch_order', {
    target_items: items.map((item) => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
    })),
    target_customer_name: values.customerName.trim(),
    target_contact_number: values.contactNumber.trim(),
    target_fulfillment_method: values.fulfillmentMethod,
    target_payment_method: values.paymentMethod,
    target_delivery_address: values.deliveryAddress.trim(),
    target_notes: values.notes.trim(),
  })
}

export async function updateMerchandiseOrderStatus(orderId, status) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  return supabase.rpc('admin_set_merch_order_status', {
    target_order_id: orderId,
    target_status: status,
  })
}

export async function deleteMerchandiseOrder(orderId) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  return supabase.rpc('admin_delete_merch_order', {
    target_order_id: orderId,
  })
}
