import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { FolderSimpleIcon, PlusIcon, Users } from '@phosphor-icons/react'

import { BoardCard } from './BoardCard'
import { Button } from '@/components/ui/button'
import { ScreenStatus } from '@/shared/components/ScreenStatus'
import { useBoardActions } from './useBoardActions'
import { useSuspenseQuery } from '@tanstack/react-query'
import { boardsQuery, type BoardUser } from '@/shared/api/board-queries'
import { useTheme } from '@/shared/hooks/useTheme'

export function BoardsScreen({ user }: { user: BoardUser }) {
  const { data: boards } = useSuspenseQuery(boardsQuery(user.id))
  const { createBoard, creating, createError } = useBoardActions(user.id)
  const { theme } = useTheme()
  const sections = [
    {
      kind: 'owned',
      title: 'Your boards',
      items: boards.filter((board) => board.role === 'owner'),
      empty: 'You haven’t created a board yet.',
    },
    {
      kind: 'shared',
      title: 'Shared with you',
      items: boards.filter((board) => board.role !== 'owner'),
      empty: 'Boards you join will appear here.',
    },
  ]

  return (
    <>
      <main className="p-4">
        <div className="mb-4 flex items-center justify-between gap-0">
          <h1 className="text-2xl font-semibold">Boards</h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={createBoard}
          disabled={creating}
        >
          <PlusIcon /> New board
        </Button>
        {createError && <ScreenStatus error>{createError}</ScreenStatus>}
        <div className="mt-6 flex flex-col gap-8">
          {sections.map((section) => (
            <section key={section.kind} className="min-w-0">
              <h2 className="mb-4 text-sm text-muted-foreground">
                {section.title}
              </h2>
              {section.items.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      {section.kind === 'owned' ? (
                        <FolderSimpleIcon aria-hidden="true" />
                      ) : (
                        <Users aria-hidden="true" />
                      )}
                    </EmptyMedia>
                    <EmptyTitle>
                      {section.kind === 'owned'
                        ? section.empty
                        : 'No shared boards yet.'}
                    </EmptyTitle>
                    {section.kind === 'shared' && (
                      <EmptyDescription>{section.empty}</EmptyDescription>
                    )}
                  </EmptyHeader>
                  {section.kind === 'owned' && (
                    <EmptyContent>
                      <Button
                        variant="outline"
                        onClick={createBoard}
                        disabled={creating}
                      >
                        <PlusIcon aria-hidden="true" /> New board
                      </Button>
                    </EmptyContent>
                  )}
                </Empty>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,--spacing(52)),--spacing(60)))] gap-4 max-[680px]:grid-cols-1 max-[680px]:gap-2.5">
                  {section.items.map((board) => (
                    <BoardCard
                      key={board.id}
                      board={board}
                      dark={theme === 'dark'}
                      userId={user.id}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </main>
    </>
  )
}
