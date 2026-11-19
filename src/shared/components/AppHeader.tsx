import { AccountMenu } from './AccountMenu'
import type { BoardSummary } from '@/shared/api/boards-client'
import type { ReactNode } from 'react'
import { cn } from 'cn'

export function AppHeader({
  navigation,
  simple,
  title,
  user,
  collaborators,
  board,
  userId,
}: {
  navigation?: boolean
  simple?: boolean
  title?: ReactNode
  user?: string
  collaborators?: ReactNode
  board?: BoardSummary
  userId?: string
}) {
  return (
    <header
      className={cn(
        'top-0 right-0 z-10',
        !simple && 'absolute m-2 p-2',
        navigation && 'w-[min(19rem,35vw)]',
      )}
    >
      <div
        className={cn(
          'flex justify-end rounded-xl p-1',
          !simple &&
            (!navigation || board) &&
            'border bg-background/5 backdrop-blur-2xl',
          navigation && 'border border-transparent',
          navigation && board && 'border-border',
        )}
      >
        {title}
        <div
          className={cn(
            'flex min-w-max items-center gap-2 max-[680px]:gap-1.5',
            navigation ? 'ml-auto pl-2' : !simple && 'ml-8',
          )}
        >
          {collaborators}
          {user && <AccountMenu name={user} board={board} userId={userId} />}
        </div>
      </div>
    </header>
  )
}
