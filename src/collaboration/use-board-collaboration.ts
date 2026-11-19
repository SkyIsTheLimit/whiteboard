import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { BoardRole } from '../shared/model'
import { BoardSession, initialBoardState } from './board-session'

const subscribeIdle = () => () => {}
const idleSnapshot = () => initialBoardState
const ignore = () => false

export function useBoardCollaboration(boardId?: string, role?: BoardRole) {
  const session = useMemo(
    () => (boardId && role ? new BoardSession(boardId, role) : undefined),
    [boardId, role],
  )
  const state = useSyncExternalStore(
    session?.subscribe ?? subscribeIdle,
    session?.getSnapshot ?? idleSnapshot,
    session?.getServerSnapshot ?? idleSnapshot,
  )

  useEffect(() => {
    if (!session) return
    session.start()
    return () => session.stop()
  }, [session])

  return {
    ...state,
    reconnect: session?.reconnect ?? ignore,
    commit: session?.commit ?? ignore,
    undo: session?.undo ?? ignore,
    redo: session?.redo ?? ignore,
    setCursor: session?.setCursor ?? ignore,
  }
}
