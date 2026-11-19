import { createServerFn } from '@tanstack/react-start'
import { getRequest, setResponseHeader } from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { sessionRequiredMessage } from './session-required'
import { authFor, googleCredentials } from '@/server/auth'
import { listBoardPreviews } from '@/server/board-reads'
import { getBoard } from '@/server/catalog'
import { listAccess } from '@/server/sharing'
import type { WorkerEnv } from '@/server/env'

async function requestUser() {
  setResponseHeader('Cache-Control', 'private, no-store')
  const request = getRequest()
  const auth = authFor(env as WorkerEnv, new URL(request.url))
  const session = await auth.api.getSession({ headers: request.headers })
  return session ? { id: session.user.id, name: session.user.name } : null
}

async function requireUser(expectedId: string) {
  const user = await requestUser()
  if (!user || user.id !== expectedId) throw new Error(sessionRequiredMessage)
  return user
}

export const readSession = createServerFn().handler(() => requestUser())

export const readBoards = createServerFn()
  .validator(z.string().min(1))
  .handler(async ({ data }) => {
    const user = await requireUser(data)
    return listBoardPreviews(env as WorkerEnv, user.id)
  })

export const readBoard = createServerFn()
  .validator(
    z.object({ userId: z.string().min(1), boardId: z.string().min(1) }),
  )
  .handler(async ({ data }) => {
    const user = await requireUser(data.userId)
    const board = await getBoard((env as WorkerEnv).DB, data.boardId, user.id)
    if (!board) throw new Error('Board unavailable.')
    return board
  })

export const readConfig = createServerFn().handler(() => ({
  googleEnabled: Boolean(googleCredentials(env as WorkerEnv)),
}))

export const readAccess = createServerFn()
  .validator(
    z.object({ userId: z.string().min(1), boardId: z.string().min(1) }),
  )
  .handler(async ({ data }) => {
    const user = await requireUser(data.userId)
    const { DB } = env as WorkerEnv
    const board = await getBoard(DB, data.boardId, user.id)
    if (!board) throw new Error('Board unavailable.')
    if (board.role !== 'owner')
      throw new Error('Only the board owner can make this change.')
    return listAccess(DB, data.boardId)
  })
