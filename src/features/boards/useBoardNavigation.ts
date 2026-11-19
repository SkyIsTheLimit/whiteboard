import { useQuery } from '@tanstack/react-query'
import { useMatchRoute, useRouterState } from '@tanstack/react-router'
import { useBoardCollaboration } from '@/collaboration/use-board-collaboration'
import { boardQuery, boardsQuery } from '@/shared/api/board-queries'

export function useBoardNavigation(userId: string) {
  const findMatch = useMatchRoute()
  const current = useRouterState({
    select: (state) =>
      state.matches.find((match) => match.routeId === '/boards/$boardId'),
  })
  const next = findMatch({
    to: '/boards/$boardId',
    pending: true,
    includeSearch: false,
  })
  const leaving = Boolean(
    current &&
    findMatch({ to: '/boards', pending: true, includeSearch: false }),
  )
  const pendingId =
    next &&
    (current?.status !== 'success' || current.params.boardId !== next.boardId)
      ? next.boardId
      : undefined
  const boardId = pendingId ?? current?.params.boardId
  const { data: catalog } = useQuery({
    ...boardsQuery(userId),
    enabled: Boolean(boardId),
  })
  const { data } = useQuery({
    ...boardQuery(userId, boardId ?? ''),
    enabled: false,
  })
  const board =
    !leaving && !pendingId && current?.status === 'success' ? data : undefined
  const room = useBoardCollaboration(board?.id, board?.role)
  const authorized =
    room.status === 'connecting' || room.status === 'connected'
      ? board
      : undefined
  const connecting = Boolean(authorized && room.status === 'connecting')
  const pendingTitle = pendingId
    ? catalog?.find((item) => item.id === pendingId)?.title
    : authorized?.title
  return {
    pendingId,
    leaving,
    catalog,
    room,
    authorized,
    connecting,
    pendingTitle,
  }
}
