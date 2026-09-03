import { createClient } from 'npm:@supabase/supabase-js@2.108.1'

const baseCorsHeaders = {
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function getAllowedOrigins() {
  const configuredOrigins = (
    Deno.env.get('ALLOWED_ORIGINS') ??
    Deno.env.get('SITE_URL') ??
    'https://cpe-website-two.vercel.app'
  )
    .split(',')
    .map((value) => value.trim())
    .map((value) => {
      try {
        const url = new URL(value)
        return ['http:', 'https:'].includes(url.protocol) ? url.origin : ''
      } catch {
        return ''
      }
    })
    .filter(Boolean)

  return configuredOrigins.length > 0
    ? configuredOrigins
    : ['https://cpe-website-two.vercel.app']
}

function getCorsHeaders(request: Request) {
  const requestedOrigin = request.headers.get('Origin')?.trim()
  const allowedOrigins = getAllowedOrigins()
  const origin = requestedOrigin && allowedOrigins.includes(requestedOrigin)
    ? requestedOrigin
    : allowedOrigins[0]

  return {
    ...baseCorsHeaders,
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin',
  }
}

type Profile = {
  id: string
  role: string
  status: string
  avatar_path: string | null
}

function jsonResponse(body: unknown, status = 200, request?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(request ?? new Request('https://cpe-website-two.vercel.app')),
      'Content-Type': 'application/json',
    },
  })
}

function getEnvironmentKey(name: string, fallbackName: string) {
  const keyedValue = Deno.env.get(name)

  if (keyedValue) {
    try {
      const parsed = JSON.parse(keyedValue)
      if (parsed.default) return parsed.default as string
    } catch {
      // Use the value directly when the runtime secret is not JSON encoded.
    }
  }

  return Deno.env.get(fallbackName) ?? ''
}

function isUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value ?? ''),
  )
}

async function removeAvatarCopies(
  adminClient: ReturnType<typeof createClient>,
  avatarPath: string | null,
) {
  if (!avatarPath) return

  await Promise.all(
    ['profile-avatars', 'staff-avatars'].map(async (bucketName) => {
      try {
        await adminClient.storage.from(bucketName).remove([avatarPath])
      } catch {
        // Account deletion must not be blocked by an already-missing avatar.
      }
    }),
  )
}

Deno.serve(async (request) => {
  const respond = (body: unknown, status = 200) =>
    jsonResponse(body, status, request)

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(request) })
  }

  if (request.method !== 'POST') {
    return respond({ error: 'Method not allowed.' }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const publishableKey = getEnvironmentKey(
      'SUPABASE_PUBLISHABLE_KEYS',
      'SUPABASE_ANON_KEY',
    )
    const adminKey = getEnvironmentKey(
      'SUPABASE_SECRET_KEYS',
      'SUPABASE_SERVICE_ROLE_KEY',
    )
    const authorization = request.headers.get('Authorization') ?? ''

    if (!supabaseUrl || !publishableKey || !adminKey || !authorization) {
      return respond({ error: 'Function authentication is unavailable.' }, 503)
    }

    const token = authorization.replace(/^Bearer\s+/i, '').trim()
    if (!token) return respond({ error: 'Authentication required.' }, 401)

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    })
    const adminClient = createClient(supabaseUrl, adminKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(token)

    if (userError || !user) {
      return respond({ error: 'Authentication required.' }, 401)
    }

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .maybeSingle()

    if (callerProfileError) throw callerProfileError
    if (callerProfile?.role !== 'admin' || callerProfile.status !== 'approved') {
      return respond({ error: 'Administrator access required.' }, 403)
    }

    let body: { userId?: unknown } = {}
    try {
      body = await request.json()
    } catch {
      return respond({ error: 'A valid user ID is required.' }, 400)
    }

    const targetUserId = body.userId
    if (!isUuid(targetUserId)) {
      return respond({ error: 'A valid user ID is required.' }, 400)
    }

    if (targetUserId === user.id) {
      return respond(
        { error: 'You cannot delete your own administrator account.' },
        400,
      )
    }

    const { data: targetProfile, error: targetProfileError } = await adminClient
      .from('profiles')
      .select('id, role, status, avatar_path')
      .eq('id', targetUserId)
      .maybeSingle<Profile>()

    if (targetProfileError) throw targetProfileError
    if (!targetProfile) return respond({ error: 'Account not found.' }, 404)

    if (targetProfile.role === 'admin' && targetProfile.status === 'approved') {
      const { count: approvedAdminCount, error: countError } = await adminClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('status', 'approved')

      if (countError) throw countError
      if ((approvedAdminCount ?? 0) <= 1) {
        return respond(
          { error: 'At least one approved administrator must remain.' },
          409,
        )
      }
    }

    await removeAvatarCopies(adminClient, targetProfile.avatar_path)

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      targetUserId,
    )

    if (deleteError) throw deleteError

    return respond({ deletedUserId: targetUserId })
  } catch (error) {
    console.error('admin-delete-user failed', error)
    return respond({ error: 'Account deletion could not be completed.' }, 500)
  }
})
