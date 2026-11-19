import { createFileRoute } from '@tanstack/react-router'
import { BoardsShell } from '@/features/boards/BoardsShell'
import { ProtectedSession } from '@/shared/components/ProtectedSession'
import { requireBoardUser } from '@/shared/api/require-board-user'

export const Route = createFileRoute('/boards')({
  beforeLoad: async ({ context, location }) => ({
    user: await requireBoardUser(context.queryClient, location.href),
  }),
  component: BoardsLayout,
})

function BoardsLayout() {
  const { user } = Route.useRouteContext()
  return (
    <ProtectedSession user={user}>
      <BoardsShell user={user} />
    </ProtectedSession>
  )
}
