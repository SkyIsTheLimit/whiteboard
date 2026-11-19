import type { QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'
import { sessionQuery } from './board-queries'
import { clearProtectedCache } from './protected-cache'

export async function requireBoardUser(
  queryClient: QueryClient,
  returnTo: string,
) {
  const previous = queryClient.getQueryData(sessionQuery.queryKey)
  const user = await queryClient.fetchQuery(sessionQuery).catch((error) => {
    clearProtectedCache(queryClient)
    throw error
  })
  if (previous && previous.id !== user?.id) clearProtectedCache(queryClient)
  if (!user) throw redirect({ to: '/sign-in', search: { returnTo } })
  return user
}
