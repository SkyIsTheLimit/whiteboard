import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ScreenStatus } from '@/shared/components/ScreenStatus'
import { boardQuery, type BoardUser } from '@/shared/api/board-queries'
import { BoardLoadingSurface } from './BoardLoadingSurface'
import { EditorWorkspace } from './EditorWorkspace'
import { useBoardRoom } from './board-room-context'

export function EditorScreen({
  boardId,
  user,
}: {
  boardId: string
  user: BoardUser
}) {
  const { data: board } = useSuspenseQuery(boardQuery(user.id, boardId))
  const room = useBoardRoom()
  if (room.status === 'connecting') return <BoardLoadingSurface />
  if (room.status !== 'connected')
    return (
      <main className="space-y-3 p-4 pt-20">
        <ScreenStatus error>
          {room.status === 'forbidden'
            ? 'You no longer have access to this board.'
            : 'Could not connect to the board.'}
        </ScreenStatus>
        {room.status !== 'forbidden' && (
          <Button type="button" variant="outline" onClick={room.reconnect}>
            Retry connection
          </Button>
        )}
        <Link className="block text-primary underline" to="/boards">
          Go to Boards
        </Link>
      </main>
    )
  return <EditorWorkspace board={board} room={room} />
}
