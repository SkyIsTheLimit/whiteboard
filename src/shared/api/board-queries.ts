import { queryOptions } from '@tanstack/react-query'
import {
  readAccess,
  readBoard,
  readBoards,
  readConfig,
  readSession,
} from './board-reads.functions'

export type BoardUser = { id: string; name: string }

export const privateQueryKey = ['boards'] as const

export const sessionQuery = queryOptions({
  queryKey: ['session'],
  queryFn: ({ signal }): Promise<BoardUser | null> => readSession({ signal }),
  staleTime: 0,
})

export const boardScope = (userId: string) =>
  [...privateQueryKey, userId] as const

export const boardsQuery = (userId: string) =>
  queryOptions({
    queryKey: [...boardScope(userId), 'list'],
    queryFn: ({ signal }) => readBoards({ data: userId, signal }),
  })

export const boardQuery = (userId: string, boardId: string) =>
  queryOptions({
    queryKey: [...boardScope(userId), 'detail', boardId],
    queryFn: ({ signal }) =>
      readBoard({
        data: { userId, boardId },
        signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
      }),
  })

export const accessQuery = (userId: string, boardId: string) =>
  queryOptions({
    queryKey: [...boardScope(userId), 'access', boardId],
    queryFn: ({ signal }) => readAccess({ data: { userId, boardId }, signal }),
    staleTime: 0,
  })

export const configQuery = queryOptions({
  queryKey: ['config'],
  queryFn: ({ signal }) => readConfig({ signal }),
})
