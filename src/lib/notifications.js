import { supabase } from './supabase'

export async function notifyPublishedContent(contentType, contentId) {
  if (!supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured.'),
    }
  }

  const { data, error } = await supabase.functions.invoke(
    'send-content-notification',
    {
      body: {
        contentType,
        contentId,
      },
    },
  )

  if (error) return { data: null, error }
  if (data?.error) {
    return { data: null, error: new Error(data.error) }
  }

  return { data, error: null }
}

export function describeNotificationResult(result) {
  if (result.error) {
    return ` Email notification was not sent: ${result.error.message}`
  }

  if (result.data?.alreadySent) {
    return ' Registered users were already notified about this item.'
  }

  const recipientCount = result.data?.recipientCount ?? 0
  if (recipientCount === 0) {
    return ' No confirmed users currently have email notifications enabled.'
  }

  return ` Email notification sent to ${recipientCount} registered ${
    recipientCount === 1 ? 'user' : 'users'
  }.`
}
