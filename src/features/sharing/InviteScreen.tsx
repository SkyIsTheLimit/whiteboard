import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { api, errorMessage } from '@/shared/api/boards-client'
import type { BoardUser } from '@/shared/api/board-queries'
import { cacheBoard, isCurrentUser } from '@/shared/api/board-cache'
import { AppHeader } from '@/shared/components/AppHeader'
import { Button } from '@/components/ui/button'
import { ScreenStatus } from '@/shared/components/ScreenStatus'

export function InviteScreen({
  token,
  user,
}: {
  token: string
  user: BoardUser
}) {
  const client = useQueryClient()
  const navigate = useNavigate()
  const join = useMutation({
    mutationFn: () => api.redeem(token),
    onSuccess: async ({ board }) => {
      if (!isCurrentUser(client, user.id)) return
      await cacheBoard(client, user.id, board)
      if (!isCurrentUser(client, user.id)) return
      await navigate({
        to: '/boards/$boardId',
        params: { boardId: board.id },
        search: {},
        replace: true,
      })
    },
  })

  return (
    <>
      <AppHeader user={user.name} />
      <main className="mx-auto my-8 w-[calc(100%-2rem)] max-w-md rounded-2xl border bg-background p-7 shadow-(--board-shadow) sm:my-16 lg:my-20">
        <h1 className="mb-5 text-2xl font-bold tracking-tight">
          Board invitation
        </h1>
        <Button
          disabled={join.isPending || join.isSuccess}
          onClick={() => join.mutate()}
        >
          Join board
        </Button>
        {join.error && (
          <ScreenStatus error>{errorMessage(join.error)}</ScreenStatus>
        )}
        <a
          className="mt-4 block text-primary underline underline-offset-3"
          href="/boards"
        >
          Go to Boards
        </a>
      </main>
    </>
  )
}
