import { createFileRoute } from '@tanstack/react-router'
import { BoardLoadError } from '@/features/boards/BoardLoadError'
import { BoardLoadingSurface } from '@/features/boards/BoardLoadingSurface'
import { EditorScreen } from '@/features/boards/EditorScreen'
import { boardQuery } from '@/shared/api/board-queries'

export const Route = createFileRoute('/boards/$boardId')({
  validateSearch: (search: Record<string, unknown>) =>
    search.rename === 1 || search.rename === '1' ? { rename: 1 as const } : {},
  loader: async ({ context: { queryClient, user }, params }) => {
    await queryClient.fetchQuery({
      ...boardQuery(user.id, params.boardId),
      staleTime: 0,
    })
  },
  pendingComponent: BoardLoadingSurface,
  errorComponent: BoardLoadError,
  component: EditorRoute,
})

function EditorRoute() {
  const { boardId } = Route.useParams()
  const { user } = Route.useRouteContext()
  return <EditorScreen key={boardId} boardId={boardId} user={user} />
}
