import { listBoards } from './catalog'
import type { WorkerEnv } from './env'

export async function listBoardPreviews(env: WorkerEnv, userId: string) {
  const { results } = await listBoards(env.DB, userId)
  return Promise.all(
    results.map(async ({ roomName, ...board }, index) => {
      if (index >= 24) return board
      const preview = await env.BOARD_ROOMS.getByName(roomName)
        .preview()
        .catch(() => undefined)
      return { ...board, preview: preview ? Array.from(preview) : undefined }
    }),
  )
}
