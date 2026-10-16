// Cloudflare Pages Function: /api/otp/status
export const onRequestGet: PagesFunction = async () => {
  return new Response(
    JSON.stringify({
      provider: 'native_otp',
      isConfigured: true,
      missingVariables: [],
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}
