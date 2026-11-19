import { privateQueryKey, sessionQuery } from '@/shared/api/board-queries'
import { sessionRequiredMessage } from '@/shared/api/session-required'
import { QueryCache, QueryClient } from '@tanstack/react-query'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: false } },
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (
          typeof window === 'undefined' ||
          query.queryKey[0] !== privateQueryKey[0] ||
          error.message !== sessionRequiredMessage
        )
          return
        void queryClient.invalidateQueries({
          queryKey: sessionQuery.queryKey,
          exact: true,
        })
      },
    }),
  })
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  })
  setupRouterSsrQueryIntegration({ router, queryClient })
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
