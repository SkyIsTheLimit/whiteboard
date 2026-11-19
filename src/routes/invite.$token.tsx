import { ProtectedSession } from '@/shared/components/ProtectedSession'
import { createFileRoute } from '@tanstack/react-router'
import { BoardLoadError } from '@/features/boards/BoardLoadError'
import { InviteScreen } from '@/features/sharing/InviteScreen'
import { requireBoardUser } from '@/shared/api/require-board-user'

export const Route = createFileRoute('/invite/$token')({
  beforeLoad: async ({ context, location }) => ({
    user: await requireBoardUser(context.queryClient, location.href),
  }),
  errorComponent: BoardLoadError,
  component: InviteRoute,
})

function InviteRoute() {
  const { token } = Route.useParams()
  const { user } = Route.useRouteContext()
  return (
    <ProtectedSession user={user}>
      <InviteScreen key={token} token={token} user={user} />
    </ProtectedSession>
  )
}
