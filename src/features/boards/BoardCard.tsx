import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { DotsThree, PencilSimple, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import { BoardPreview } from '@/canvas/BoardPreview'
import { Link } from '@tanstack/react-router'
import { type BoardSummary } from '@/shared/api/boards-client'
import { DeleteBoardDialog } from './DeleteBoardDialog'

export function BoardCard({
  board,
  userId,
  dark,
}: {
  board: BoardSummary
  userId: string
  dark: boolean
}) {
  const [deleting, setDeleting] = useState(false)

  return (
    <article className="group/card relative w-full max-w-60 min-w-0 rounded-xl border bg-background shadow-(--board-shadow) max-[680px]:max-w-none">
      <Link
        to="/boards/$boardId"
        params={{ boardId: board.id }}
        className="group/card-link block overflow-hidden rounded-[inherit]"
      >
        <div className="pointer-events-none h-28" aria-hidden="true">
          <BoardPreview elements={board.preview ?? []} dark={dark} />
        </div>
        <div className="flex min-h-11 items-center gap-2 border-t px-3 py-1.5 group-hover/card-link:bg-[color-mix(in_srgb,var(--board-selection-bg)_44%,var(--board-panel))] max-[680px]:flex-wrap max-[680px]:gap-x-2 max-[680px]:gap-y-1">
          <h3 className="text-sm">{board.title}</h3>
          {board.role !== 'owner' && (
            <span className="ml-auto shrink-0 max-[680px]:ml-0">
              <Badge variant="secondary">
                {board.role === 'editor' ? 'Can edit' : 'Can view'}
              </Badge>
            </span>
          )}
        </div>
      </Link>
      {board.role === 'owner' && (
        <>
          <DropdownMenu>
            <div className="pointer-events-none absolute top-2 right-2 opacity-0 group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100 group-hover/card:pointer-events-auto group-hover/card:opacity-100 has-data-popup-open:pointer-events-auto has-data-popup-open:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100">
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Manage ${board.title}`}
                  />
                }
              >
                <DotsThree className="size-5" weight="bold" />
              </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent
              className="ring-border focus-visible:outline-none"
              align="end"
              sideOffset={5}
            >
              <DropdownMenuItem
                render={
                  <Link
                    to="/boards/$boardId"
                    params={{ boardId: board.id }}
                    search={{ rename: 1 }}
                  />
                }
              >
                <PencilSimple className="size-4" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleting(true)}
              >
                <Trash className="size-4" /> Delete board
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DeleteBoardDialog
            board={board}
            open={deleting}
            onOpenChange={setDeleting}
            userId={userId}
          />
        </>
      )}
    </article>
  )
}
