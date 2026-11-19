import { createFileRoute } from '@tanstack/react-router'
import { BoardsScreen } from '@/features/boards/BoardsScreen'
import { BoardLoadError } from '@/features/boards/BoardLoadError'
import { boardsQuery } from '@/shared/api/board-queries'

export const Route = createFileRoute('/boards/')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(boardsQuery(context.user.id))
  },
  errorComponent: BoardLoadError,
  component: BoardsRoute,
})

function BoardsRoute() {
  const { user } = Route.useRouteContext()
  return <BoardsScreen user={user} />
}
