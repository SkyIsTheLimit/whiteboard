import type { QueryClient } from '@tanstack/react-query'
import { privateQueryKey } from './board-queries'

export function clearProtectedCache(client: QueryClient) {
  client.removeQueries({ queryKey: privateQueryKey })
  client.getMutationCache().clear()
}
