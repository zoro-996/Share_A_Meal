import { onRequest } from './functions/api/[[path]].ts'

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Route /api/* requests to the complete in-memory API engine
    if (url.pathname.startsWith('/api/')) {
      try {
        const response = await onRequest({
          request,
          env,
          next: () =>
            new Response(JSON.stringify({ success: false, error: 'Endpoint not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            }),
          params: { path: url.pathname.replace(/^\/api\/?/, '').split('/') },
        } as any)

        return response
      } catch (err) {
        return new Response(
          JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : 'Internal worker error',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Fall back to Cloudflare static asset handling and SPA routing
    return env.ASSETS.fetch(request)
  },
}
