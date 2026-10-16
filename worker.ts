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
      const response = await onRequest({
        request,
        env,
        next: () => env.ASSETS.fetch(request),
        params: { path: url.pathname.replace(/^\/api\/?/, '').split('/') },
      } as any)

      return response
    }

    // Fall back to Cloudflare static asset handling and SPA routing
    return env.ASSETS.fetch(request)
  },
}
