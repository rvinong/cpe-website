const baseHeaders = {
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function getHeaders(request: Request) {
  const configuredOrigin =
    Deno.env.get('SITE_URL') ?? 'https://cpe-website-two.vercel.app'
  let allowedOrigin = 'https://cpe-website-two.vercel.app'

  try {
    const url = new URL(configuredOrigin)
    if (['http:', 'https:'].includes(url.protocol)) allowedOrigin = url.origin
  } catch {
    // Keep the production fallback for malformed or missing configuration.
  }

  const requestedOrigin = request.headers.get('Origin')?.trim()

  return {
    ...baseHeaders,
    'Access-Control-Allow-Origin':
      requestedOrigin === allowedOrigin ? requestedOrigin : allowedOrigin,
    Vary: 'Origin',
    'Content-Type': 'application/json',
  }
}

Deno.serve((request) => {
  const headers = getHeaders(request)

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  return new Response(
    JSON.stringify({
      error: 'This legacy email endpoint has been retired.',
    }),
    { status: 410, headers },
  )
})
