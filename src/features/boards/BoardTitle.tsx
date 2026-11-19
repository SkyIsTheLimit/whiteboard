import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { LockSimple } from '@phosphor-icons/react'
import { BoardSwitcher } from './BoardSwitcher'
import { useBoardTitle } from './useBoardTitle'
import type { BoardSummary } from '@/shared/api/boards-client'

export function BoardTitle({
  board,
  boards,
  creating,
  onCreate,
  userId,
  onDelete,
}: {
  board: BoardSummary
  boards: BoardSummary[]
  creating: boolean
  onCreate: () => void
  userId: string
  onDelete: () => void
}) {
  const title = useBoardTitle(userId, board)
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {title.editing ? (
        <form
          className="w-[min(--spacing(40),30vw)] max-w-full min-w-20"
          onSubmit={(event) => {
            event.preventDefault()
            void title.save()
          }}
        >
          <Input
            aria-label="Board name"
            ref={title.input}
            value={title.draft}
            maxLength={120}
            onChange={(event) => title.setDraft(event.target.value)}
            onBlur={() => void title.save()}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                title.cancel()
              }
            }}
          />
        </form>
      ) : (
        <BoardSwitcher
          board={board}
          boards={boards}
          creating={creating}
          onCreate={onCreate}
          onRename={title.start}
          onDelete={onDelete}
        />
      )}
      {title.editing && (
        <span className="flex items-center gap-1.5 text-sm whitespace-nowrap max-[680px]:hidden">
          <LockSimple className="size-4" /> Private
        </span>
      )}
      {board.role === 'viewer' && (
        <span className="shrink-0 max-[680px]:hidden">
          <Badge variant="secondary">Can view</Badge>
        </span>
      )}
      {title.error && (
        <p
          className="absolute top-full mt-1 rounded-md bg-background px-2.5 py-2 text-sm text-destructive"
          role="alert"
        >
          {title.error}
        </p>
      )}
    </div>
  )
}
