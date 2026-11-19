import { Link } from '@tanstack/react-router'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  CaretDown,
  Check,
  FolderSimple,
  PencilSimple,
  Plus,
  Trash,
} from '@phosphor-icons/react'
import { type BoardSummary } from '@/shared/api/boards-client'

export function BoardSwitcher({
  board,
  boards,
  creating,
  onCreate,
  onRename,
  onDelete,
}: {
  board: BoardSummary
  boards: BoardSummary[]
  creating: boolean
  onCreate: () => void
  onRename: () => void
  onDelete: () => void
}) {
  const orderedBoards = [
    board,
    ...boards.filter((item) => item.id !== board.id),
  ]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex min-w-0 items-center gap-2 rounded-md px-0.5 py-1 text-base hover:text-primary max-[365px]:text-sm"
        aria-label={`Switch board, current board ${board.title}`}
      >
        <span className="truncate">{board.title}</span>{' '}
        <CaretDown className="size-3.5 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="max-w-[min(--spacing(72),90vw)] min-w-64 ring-border focus-visible:outline-none"
        align="start"
        alignOffset={-174}
        sideOffset={7}
      >
        {orderedBoards.map((item) => (
          <DropdownMenuItem
            key={item.id}
            render={
              <Link
                to="/boards/$boardId"
                params={{ boardId: item.id }}
                aria-current={item.id === board.id ? 'page' : undefined}
              />
            }
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="size-4 shrink-0">
                {item.id === board.id && (
                  <Check className="size-4 text-primary" />
                )}
              </span>
              <span className="truncate">{item.title}</span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreate} disabled={creating}>
          <Plus className="size-4" /> New board
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/boards" />}>
          <FolderSimple className="size-4" /> All boards
        </DropdownMenuItem>
        {board.role === 'owner' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRename}>
              <PencilSimple className="size-4" /> Rename board
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash className="size-4" /> Delete board
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
