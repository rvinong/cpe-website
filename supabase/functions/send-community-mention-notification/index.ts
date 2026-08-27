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

type MentionTarget = {
  id: string
  nickname: string | null
  full_name: string | null
  email_notifications: boolean
  status: string
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
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

function displayName(
  profile?: Pick<MentionTarget, 'nickname' | 'full_name'> | null,
) {
  return (
    profile?.nickname?.trim() || profile?.full_name?.trim() || 'Member'
  )
}

function isUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value ?? ''),
  )
}

async function sendEmail(
  apiKey: string,
  fromAddress: string,
  recipient: string,
  subject: string,
  html: string,
  text: string,
) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [recipient],
      subject,
      html,
      text,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Email provider rejected the request: ${detail}`)
  }
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
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
    const fromAddress = Deno.env.get('EMAIL_FROM') ?? ''
    const siteUrl = (
      Deno.env.get('SITE_URL') ?? 'https://cpe-website-two.vercel.app'
    ).replace(/\/+$/, '')
    const authorization = request.headers.get('Authorization') ?? ''

    if (!supabaseUrl || !publishableKey || !adminKey || !authorization) {
      return jsonResponse({ error: 'Function authentication is unavailable.' }, 503)
    }

    if (!resendApiKey || !fromAddress) {
      return jsonResponse(
        {
          error:
            'Email delivery is not configured. Add RESEND_API_KEY and EMAIL_FROM to the Edge Function secrets.',
        },
        503,
      )
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

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .maybeSingle()

    if (callerProfileError) throw callerProfileError
    if (callerProfile?.status !== 'approved') {
      return jsonResponse({ error: 'Approved account required.' }, 403)
    }

    const body = await request.json()
    const messageId = body.messageId

    if (!isUuid(messageId)) {
      return jsonResponse({ error: 'Invalid message ID.' }, 400)
    }

    const { data: message, error: messageError } = await adminClient
      .from('community_messages')
      .select('id, room_id, user_id, body, created_at, deleted_at')
      .eq('id', messageId)
      .maybeSingle()

    if (messageError) throw messageError
    if (!message || message.deleted_at) {
      return jsonResponse({ sentCount: 0, skippedCount: 0 })
    }
    if (message.user_id !== user.id) {
      return jsonResponse(
        { error: 'Only the message author can request its notifications.' },
        403,
      )
    }

    const [{ data: room, error: roomError }, { data: author, error: authorError }, { data: mentions, error: mentionsError }] =
      await Promise.all([
        adminClient
          .from('community_rooms')
          .select('id, title, is_active, is_locked')
          .eq('id', message.room_id)
          .maybeSingle(),
        adminClient
          .from('profiles')
          .select('nickname, full_name')
          .eq('id', message.user_id)
          .maybeSingle(),
        adminClient
          .from('community_message_mentions')
          .select('mentioned_profile_id')
          .eq('message_id', message.id),
      ])

    if (roomError) throw roomError
    if (authorError) throw authorError
    if (mentionsError) throw mentionsError
    if (!room || !room.is_active || room.is_locked || !mentions?.length) {
      return jsonResponse({ sentCount: 0, skippedCount: 0 })
    }

    const targetIds = [
      ...new Set(
        mentions
          .map((mention) => mention.mentioned_profile_id)
          .filter((targetId) => targetId && targetId !== user.id),
      ),
    ]

    if (!targetIds.length) return jsonResponse({ sentCount: 0, skippedCount: 0 })

    const { data: targetProfiles, error: targetProfilesError } = await adminClient
      .from('profiles')
      .select('id, nickname, full_name, email_notifications, status')
      .in('id', targetIds)
      .eq('status', 'approved')
      .eq('email_notifications', true)

    if (targetProfilesError) throw targetProfilesError

    const safeRoomTitle = escapeHtml(room.title)
    const safeAuthorName = escapeHtml(displayName(author))
    const safeMessage = escapeHtml(message.body)
    const messageUrl = `${siteUrl}/community?room=${encodeURIComponent(message.room_id)}#community-message-${message.id}`
    let sentCount = 0
    let skippedCount = targetIds.length - (targetProfiles?.length ?? 0)

    for (const target of (targetProfiles ?? []) as MentionTarget[]) {
      const { data: authUser, error: authUserError } =
        await adminClient.auth.admin.getUserById(target.id)

      if (authUserError) throw authUserError

      const email = authUser.user?.email?.trim().toLowerCase()
      if (!email || !authUser.user.email_confirmed_at) {
        skippedCount += 1
        continue
      }

      const { data: existingLog, error: existingLogError } = await adminClient
        .from('community_mention_notification_log')
        .select('id, status, attempts')
        .eq('message_id', message.id)
        .eq('mentioned_profile_id', target.id)
        .maybeSingle()

      if (existingLogError) throw existingLogError
      if (existingLog?.status === 'sent') {
        skippedCount += 1
        continue
      }

      const nextAttempts = (existingLog?.attempts ?? 0) + 1
      const logPayload = {
        message_id: message.id,
        mentioned_profile_id: target.id,
        status: 'pending',
        attempts: nextAttempts,
        last_error: null,
        sent_at: null,
      }
      const { error: logWriteError } = existingLog
        ? await adminClient
            .from('community_mention_notification_log')
            .update(logPayload)
            .eq('id', existingLog.id)
        : await adminClient
            .from('community_mention_notification_log')
            .insert(logPayload)

      if (logWriteError) throw logWriteError

      try {
        const subject = `[ICpEP Connect] ${displayName(author)} mentioned you`
        const html = `
          <div style="margin:0 auto;max-width:620px;padding:32px 20px;font-family:Arial,sans-serif;color:#0f172a">
            <p style="margin:0 0 12px;color:#2563eb;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">
              ICpEP Connect - Community Hub
            </p>
            <h1 style="margin:0 0 16px;font-size:28px;line-height:1.25">You were mentioned in ${safeRoomTitle}</h1>
            <p style="margin:0 0 8px;color:#475569;font-size:16px;line-height:1.6">
              <strong>${safeAuthorName}</strong> mentioned you in a community message:
            </p>
            <blockquote style="margin:0 0 24px;border-left:4px solid #2563eb;padding:12px 16px;background:#eff6ff;color:#334155;font-size:16px;line-height:1.7">
              ${safeMessage}
            </blockquote>
            <a href="${messageUrl}" style="display:inline-block;border-radius:10px;background:#2563eb;padding:13px 20px;color:#fff;font-weight:700;text-decoration:none">
              Open the conversation
            </a>
            <p style="margin:28px 0 0;color:#64748b;font-size:12px;line-height:1.6">
              You are receiving this because email notifications are enabled for your portal account.
              Manage this preference from your account page.
            </p>
          </div>
        `
        const text = `${displayName(author)} mentioned you in ${room.title}:\n\n${message.body}\n\nOpen the conversation: ${messageUrl}`

        await sendEmail(
          resendApiKey,
          fromAddress,
          email,
          subject,
          html,
          text,
        )

        const { error: sentLogError } = await adminClient
          .from('community_mention_notification_log')
          .update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null })
          .eq('message_id', message.id)
          .eq('mentioned_profile_id', target.id)

        if (sentLogError) throw sentLogError

        sentCount += 1
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Email delivery failed.'
        await adminClient
          .from('community_mention_notification_log')
          .update({ status: 'failed', last_error: errorMessage })
          .eq('message_id', message.id)
          .eq('mentioned_profile_id', target.id)
        throw error
      }
    }

    return jsonResponse({ sentCount, skippedCount })
  } catch (error) {
    console.error(error)
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Mention notification failed.',
      },
      500,
    )
  }
})
