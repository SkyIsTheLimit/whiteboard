import { createContext, useContext } from 'react'

import type { useBoardCollaboration } from '@/collaboration/use-board-collaboration'

export const BoardRoomContext = createContext<ReturnType<
  typeof useBoardCollaboration
> | null>(null)

export function useBoardRoom() {
  const room = useContext(BoardRoomContext)
  if (!room) throw new Error('The editor requires the Boards layout.')
  return room
}
