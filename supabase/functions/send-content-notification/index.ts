import { createClient } from 'npm:@supabase/supabase-js@2.108.1'

const corsHeaders = {
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
}

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
}

type ContentType = 'announcement' | 'news'

type ContentRecord = {
  id: string
  slug: string
  title: string
  summary: string
  status: string
  published_at: string | null
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  })
}

function getEnvironmentKey(name: string, fallbackName: string) {
  const keyedValues = Deno.env.get(name)

  if (keyedValues) {
    try {
      const parsed = JSON.parse(keyedValues)
      if (parsed.default) return parsed.default as string
    } catch {
      // Fall through to the legacy environment value.
    }
  }

  return Deno.env.get(fallbackName) ?? ''
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character] ?? character,
  )
}

function splitIntoChunks<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

async function getContent(
  adminClient: ReturnType<typeof createClient>,
  contentType: ContentType,
  contentId: string,
) {
  const table = contentType === 'announcement' ? 'announcements' : 'news_posts'

  return adminClient
    .from(table)
    .select('id, slug, title, summary, status, published_at')
    .eq('id', contentId)
    .maybeSingle<ContentRecord>()
}

async function getEligibleEmails(
  adminClient: ReturnType<typeof createClient>,
) {
  const emails = new Set<string>()
  const perPage = 1000

  for (let page = 1; ; page += 1) {
    const {
      data: { users },
      error,
    } = await adminClient.auth.admin.listUsers({ page, perPage })

    if (error) throw error
    if (users.length === 0) break

    const confirmedUsers = users.filter(
      (user) => user.email && user.email_confirmed_at,
    )
    const userIds = confirmedUsers.map((user) => user.id)

    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await adminClient
        .from('profiles')
        .select('id')
        .in('id', userIds)
        .eq('email_notifications', true)
        .neq('status', 'suspended')

      if (profileError) throw profileError

      const eligibleIds = new Set(
        (profiles ?? []).map((profile) => profile.id),
      )

      confirmedUsers.forEach((user) => {
        if (eligibleIds.has(user.id) && user.email) {
          emails.add(user.email.trim().toLowerCase())
        }
      })
    }

    if (users.length < perPage) break
  }

  return [...emails]
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
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
      return jsonResponse({ error: 'Function authentication is unavailable.' }, 503)
    }

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const adminClient = createClient(supabaseUrl, adminKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const token = authorization.replace(/^Bearer\s+/i, '')
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(token)

    if (userError || !user) {
      return jsonResponse({ error: 'Authentication required.' }, 401)
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .maybeSingle()

    if (
      profileError ||
      profile?.status !== 'approved' ||
      !['admin', 'editor'].includes(profile.role)
    ) {
      return jsonResponse({ error: 'Staff access required.' }, 403)
    }

    const body = await request.json()
    const contentType = body.contentType as ContentType
    const contentId = String(body.contentId ?? '')

    if (
      !['announcement', 'news'].includes(contentType) ||
      !/^[0-9a-f-]{36}$/i.test(contentId)
    ) {
      return jsonResponse({ error: 'Invalid notification request.' }, 400)
    }

    const { data: existingLog, error: logError } = await adminClient
      .from('email_notification_log')
      .select('recipient_count, sent_at')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .maybeSingle()

    if (logError) throw logError

    if (existingLog) {
      return jsonResponse({
        alreadySent: true,
        recipientCount: existingLog.recipient_count,
        sentAt: existingLog.sent_at,
      })
    }

    const { data: content, error: contentError } = await getContent(
      adminClient,
      contentType,
      contentId,
    )

    if (contentError) throw contentError

    if (
      !content ||
      content.status !== 'published' ||
      !content.published_at ||
      new Date(content.published_at) > new Date()
    ) {
      return jsonResponse({ error: 'Published content was not found.' }, 404)
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
    const fromAddress = Deno.env.get('EMAIL_FROM') ?? ''
    const siteUrl = (
      Deno.env.get('SITE_URL') ?? 'https://cpe-website-two.vercel.app'
    ).replace(/\/+$/, '')

    if (!resendApiKey || !fromAddress) {
      return jsonResponse(
        {
          error:
            'Email delivery is not configured. Add RESEND_API_KEY and EMAIL_FROM to the Edge Function secrets.',
        },
        503,
      )
    }

    const emails = await getEligibleEmails(adminClient)
    const contentLabel =
      contentType === 'announcement' ? 'announcement' : 'news story'
    const contentUrl =
      contentType === 'announcement'
        ? `${siteUrl}/announcements/${content.slug}`
        : `${siteUrl}/gallery#news`
    const accountUrl = `${siteUrl}/account`
    const safeTitle = escapeHtml(content.title)
    const safeSummary = escapeHtml(content.summary)

    const emailMessages = emails.map((email) => ({
      from: fromAddress,
      to: [email],
      subject: `[NwSSU CPE] New ${contentLabel}: ${content.title}`,
      html: `
        <div style="margin:0 auto;max-width:620px;padding:32px 20px;font-family:Arial,sans-serif;color:#0f172a">
          <p style="margin:0 0 12px;color:#2563eb;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">
            NwSSU Computer Engineering Organization
          </p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.25">${safeTitle}</h1>
          <p style="margin:0 0 24px;color:#475569;font-size:16px;line-height:1.7">${safeSummary}</p>
          <a href="${contentUrl}" style="display:inline-block;border-radius:10px;background:#2563eb;padding:13px 20px;color:#fff;font-weight:700;text-decoration:none">
            Read the ${contentLabel}
          </a>
          <p style="margin:28px 0 0;color:#64748b;font-size:12px;line-height:1.6">
            You are receiving this because organization email notifications are enabled for your portal account.
            <a href="${accountUrl}" style="color:#2563eb">Manage your preference</a>.
          </p>
        </div>
      `,
      text: `${content.title}\n\n${content.summary}\n\nRead the ${contentLabel}: ${contentUrl}\n\nManage email notifications: ${accountUrl}`,
      tags: [
        { name: 'content_type', value: contentType },
        { name: 'content_id', value: content.id.replaceAll('-', '_') },
      ],
    }))

    const batches = splitIntoChunks(emailMessages, 100)

    for (const [index, batch] of batches.entries()) {
      const response = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `${contentType}-${content.id}-${index}`,
        },
        body: JSON.stringify(batch),
      })

      if (!response.ok) {
        const detail = await response.text()
        throw new Error(`Email provider rejected the request: ${detail}`)
      }
    }

    const { error: insertLogError } = await adminClient
      .from('email_notification_log')
      .insert({
        content_type: contentType,
        content_id: content.id,
        recipient_count: emails.length,
        sent_by: user.id,
      })

    if (insertLogError?.code !== '23505') throw insertLogError

    return jsonResponse({
      alreadySent: false,
      recipientCount: emails.length,
    })
  } catch (error) {
    console.error(error)
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Email notification failed.',
      },
      500,
    )
  }
})
