import handler from '@tanstack/react-start/server-entry'
import { handleApi } from './server/api'
import type { WorkerEnv } from './server/env'

export { BoardRoom } from './server/board-room'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/'))
      return handleApi(request, env, url, ctx)
    const response = await handler.fetch(request)
    const headers = new Headers(response.headers)
    headers.set('Cache-Control', 'private, no-store')
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  },
} satisfies ExportedHandler<WorkerEnv>
