const headers = {
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

Deno.serve((request) => {
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
