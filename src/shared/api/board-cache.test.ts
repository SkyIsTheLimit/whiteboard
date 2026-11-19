import { QueryClient } from '@tanstack/react-query'
import { describe, expect, test, vi } from 'vitest'
import { cacheBoard, uncacheBoard } from './board-cache'
import { boardQuery, boardsQuery, sessionQuery } from './board-queries'
import type { BoardSummary } from './boards-client'

vi.mock('./board-reads.functions', () => ({}))

const original: BoardSummary = {
  id: 'sample',
  title: 'Original',
  role: 'owner',
  updatedAt: '2026-01-01',
}

describe('board mutation cache', () => {
  test('renames in both queries and removes the board from the active user only', async () => {
    const client = new QueryClient()
    client.setQueryData(sessionQuery.queryKey, () => ({
      id: 'owner',
      name: 'Owner',
    }))
    client.setQueryData(boardsQuery('owner').queryKey, [
      { ...original, preview: [] },
    ])
    client.setQueryData(boardsQuery('viewer').queryKey, [
      { ...original, role: 'viewer' },
    ])
    await cacheBoard(client, 'owner', { ...original, title: 'Renamed' })
    expect(
      client.getQueryData(boardQuery('owner', original.id).queryKey)?.title,
    ).toBe('Renamed')
    expect(client.getQueryData(boardsQuery('owner').queryKey)).toEqual([
      { ...original, title: 'Renamed', preview: [] },
    ])
    await uncacheBoard(client, 'owner', original.id)
    expect(
      client.getQueryData(boardQuery('owner', original.id).queryKey),
    ).toBeUndefined()
    expect(client.getQueryData(boardsQuery('owner').queryKey)).toEqual([])
    expect(client.getQueryData(boardsQuery('viewer').queryKey)).toEqual([
      { ...original, role: 'viewer' },
    ])
  })

  test('ignores late mutation responses after an account change', async () => {
    const client = new QueryClient()
    client.setQueryData(sessionQuery.queryKey, () => ({
      id: 'viewer',
      name: 'Viewer',
    }))
    await cacheBoard(client, 'owner', original)
    expect(
      client.getQueryData(boardQuery('owner', original.id).queryKey),
    ).toBeUndefined()
  })
  test('ignores late success while session verification is failing', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    client.setQueryData(sessionQuery.queryKey, () => ({
      id: 'owner',
      name: 'Owner',
    }))
    await expect(
      client.fetchQuery({
        ...sessionQuery,
        queryFn: async () => {
          throw new Error('Session service unavailable')
        },
      }),
    ).rejects.toThrow('Session service unavailable')
    await cacheBoard(client, 'owner', original)
    expect(
      client.getQueryData(boardQuery('owner', original.id).queryKey),
    ).toBeUndefined()
  })

  test.each(['rename', 'delete'])(
    'an older list response cannot overwrite a successful %s',
    async (action) => {
      const client = new QueryClient()
      const options = boardsQuery('owner')
      client.setQueryData(sessionQuery.queryKey, () => ({
        id: 'owner',
        name: 'Owner',
      }))
      client.setQueryData(options.queryKey, [original])
      let finishRead!: (boards: BoardSummary[]) => void
      const oldRead = new Promise<BoardSummary[]>((resolve) => {
        finishRead = resolve
      })
      // Model a transport that completes even after its Query is canceled.
      const fetch = client
        .fetchQuery({ ...options, staleTime: 0, queryFn: () => oldRead })
        .catch((error) => error)
      expect(client.getQueryState(options.queryKey)?.fetchStatus).toBe(
        'fetching',
      )
      const renamed = { ...original, title: 'Renamed' }
      if (action === 'rename') await cacheBoard(client, 'owner', renamed)
      else await uncacheBoard(client, 'owner', original.id)
      finishRead([original])
      await fetch
      await oldRead
      expect(client.getQueryData(options.queryKey)).toEqual(
        action === 'rename' ? [renamed] : [],
      )
    },
  )
})
