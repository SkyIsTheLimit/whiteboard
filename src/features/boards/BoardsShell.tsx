import { Link, Outlet, useNavigate } from '@tanstack/react-router'

import { AppHeader } from '@/shared/components/AppHeader'
import { Badge } from '@/components/ui/badge'
import { BoardLoadingSurface } from './BoardLoadingSurface'
import { BoardRoomContext } from './board-room-context'
import { BoardTitle } from './BoardTitle'
import type { BoardUser } from '@/shared/api/board-queries'
import { DeleteBoardDialog } from './DeleteBoardDialog'
import { Logo } from '@/shared/components/Logo'
import { PresenceAvatars } from './PresenceAvatars'
import { ScreenStatus } from '@/shared/components/ScreenStatus'
import { Spinner } from '@/components/ui/spinner'
import { useBoardActions } from './useBoardActions'
import { useBoardNavigation } from './useBoardNavigation'
import { useState } from 'react'

export function BoardsShell({ user }: { user: BoardUser }) {
  const {
    pendingId,
    leaving,
    catalog,
    room,
    authorized,
    connecting,
    pendingTitle,
  } = useBoardNavigation(user.id)
  const [deleteBoardId, setDeleteBoardId] = useState<string>()
  const { createBoard, creating, createError } = useBoardActions(user.id)
  const navigate = useNavigate()

  return (
    <>
      <Logo
        size="2rem"
        className="pointer-events-none fixed bottom-2 left-2 z-20 rounded-lg border border-border/30"
      />
      <div className="relative min-h-dvh">
        <AppHeader
          navigation
          user={user.name}
          userId={user.id}
          board={authorized}
          title={
            pendingId || connecting ? (
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate">
                  {pendingTitle ?? 'Opening board'}
                </span>
                <span className="shrink-0">
                  <Spinner />
                </span>
                {authorized?.role === 'viewer' && (
                  <span className="shrink-0 max-sm:hidden">
                    <Badge variant="secondary">Can view</Badge>
                  </span>
                )}
              </div>
            ) : authorized ? (
              <BoardTitle
                board={authorized}
                boards={catalog ?? [authorized]}
                creating={creating}
                onCreate={createBoard}
                userId={user.id}
                onDelete={() => setDeleteBoardId(authorized.id)}
              />
            ) : (
              <Link
                to="/boards"
                aria-label="All boards"
                className="sr-only focus:not-sr-only"
              >
                Boards
              </Link>
            )
          }
          collaborators={
            authorized && (
              <PresenceAvatars presence={room.presence} userId={user.id} />
            )
          }
        />

        {createError && <ScreenStatus error>{createError}</ScreenStatus>}
        <BoardRoomContext.Provider value={room}>
          {pendingId ? (
            <BoardLoadingSurface />
          ) : leaving ? (
            <ScreenStatus>Loading boards…</ScreenStatus>
          ) : (
            <Outlet />
          )}
        </BoardRoomContext.Provider>
        {authorized && (
          <DeleteBoardDialog
            key={authorized.id}
            userId={user.id}
            board={authorized}
            open={deleteBoardId === authorized.id}
            onOpenChange={(open) =>
              setDeleteBoardId(open ? authorized.id : undefined)
            }
            onDelete={() => void navigate({ to: '/boards' })}
          />
        )}
      </div>
    </>
  )
}
