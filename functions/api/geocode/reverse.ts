// Cloudflare Pages Function: /api/geocode/reverse
export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url)
  const lat = url.searchParams.get('lat')
  const lon = url.searchParams.get('lon')

  if (!lat || !lon) {
    return new Response(JSON.stringify({ error: 'lat and lon parameters are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}&addressdetails=1`

    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'ShareAMealApp/1.0 (contact@shareameal.local)',
        'Accept': 'application/json',
        'Accept-Language': 'en',
      },
    })

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Reverse geocode service returned error.' }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Reverse geocode failed.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
