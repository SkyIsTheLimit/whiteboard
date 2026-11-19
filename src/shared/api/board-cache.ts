import type { QueryClient } from '@tanstack/react-query'
import {
  accessQuery,
  boardQuery,
  boardsQuery,
  sessionQuery,
} from './board-queries'
import type { BoardSummary } from './boards-client'

// A request that finishes after sign-out must not repopulate the old user's cache.
export function isCurrentUser(client: QueryClient, userId: string) {
  const session = client.getQueryState(sessionQuery.queryKey)
  return session?.status === 'success' && session.data?.id === userId
}

async function cancelOlderBoardReads(
  client: QueryClient,
  userId: string,
  boardId: string,
) {
  await Promise.all([
    client.cancelQueries({
      queryKey: boardsQuery(userId).queryKey,
      exact: true,
    }),
    client.cancelQueries({
      queryKey: boardQuery(userId, boardId).queryKey,
      exact: true,
    }),
  ])
}

export async function cacheBoard(
  client: QueryClient,
  userId: string,
  board: BoardSummary,
) {
  if (!isCurrentUser(client, userId)) return
  await cancelOlderBoardReads(client, userId, board.id)
  if (!isCurrentUser(client, userId)) return
  client.setQueryData(boardQuery(userId, board.id).queryKey, board)
  client.setQueryData(boardsQuery(userId).queryKey, (current) => {
    if (!current) return current
    const existing = current.find((item) => item.id === board.id)
    return [
      { ...existing, ...board },
      ...current.filter((item) => item.id !== board.id),
    ]
  })
}

export async function uncacheBoard(
  client: QueryClient,
  userId: string,
  boardId: string,
) {
  if (!isCurrentUser(client, userId)) return
  await cancelOlderBoardReads(client, userId, boardId)
  if (!isCurrentUser(client, userId)) return
  client.setQueryData(boardsQuery(userId).queryKey, (current) =>
    current?.filter((item) => item.id !== boardId),
  )
  client.removeQueries({
    queryKey: boardQuery(userId, boardId).queryKey,
    exact: true,
  })
  client.removeQueries({
    queryKey: accessQuery(userId, boardId).queryKey,
    exact: true,
  })
}
