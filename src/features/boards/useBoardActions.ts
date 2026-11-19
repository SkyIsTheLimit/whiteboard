import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { api, errorMessage } from '@/shared/api/boards-client'
import { cacheBoard, isCurrentUser } from '@/shared/api/board-cache'
import { boardsQuery } from '@/shared/api/board-queries'

export function useBoardActions(userId: string) {
  const client = useQueryClient()
  const navigate = useNavigate()
  const create = useMutation({
    mutationFn: api.create,
    onSuccess: async ({ board }) => {
      if (!isCurrentUser(client, userId)) return
      await cacheBoard(client, userId, board)
      if (!isCurrentUser(client, userId)) return
      await client.invalidateQueries({ queryKey: boardsQuery(userId).queryKey })
      if (!isCurrentUser(client, userId)) return
      await navigate({
        to: '/boards/$boardId',
        params: { boardId: board.id },
        search: { rename: 1 },
      })
    },
  })

  return {
    creating: create.isPending || create.isSuccess,
    createBoard: () => create.mutate(),
    createError: create.error ? errorMessage(create.error) : '',
  }
}
