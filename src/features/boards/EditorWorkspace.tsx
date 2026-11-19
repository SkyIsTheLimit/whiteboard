import { BoardCanvas } from '@/canvas/BoardCanvas'
import type { useBoardCollaboration } from '@/collaboration/use-board-collaboration'
import { ScreenStatus } from '@/shared/components/ScreenStatus'
import type { BoardSummary } from '@/shared/api/boards-client'
import { useTheme } from '@/shared/hooks/useTheme'

export function EditorWorkspace({
  board,
  room,
}: {
  board: BoardSummary
  room: ReturnType<typeof useBoardCollaboration>
}) {
  const { theme } = useTheme()
  return (
    <main className="relative grid h-dvh min-h-0" aria-label={board.title}>
      <BoardCanvas
        title={board.title}
        elements={room.elements}
        presence={room.presence}
        dark={theme === 'dark'}
        readOnly={board.role === 'viewer'}
        onCommit={room.commit}
        onCursor={room.setCursor}
        onUndo={room.undo}
        onRedo={room.redo}
        canUndo={room.canUndo}
        canRedo={room.canRedo}
      />
      {room.error && (
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border bg-background px-3 shadow-(--board-shadow)">
          <ScreenStatus error>{room.error}</ScreenStatus>
        </div>
      )}
    </main>
  )
}
