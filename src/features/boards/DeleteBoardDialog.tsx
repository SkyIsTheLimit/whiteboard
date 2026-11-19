import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uncacheBoard } from '@/shared/api/board-cache'
import {
  api,
  errorMessage,
  type BoardSummary,
} from '@/shared/api/boards-client'
import { Button } from '@/components/ui/button'

export function DeleteBoardDialog({
  board,
  userId,
  open,
  onOpenChange,
  onDelete,
}: {
  board: BoardSummary
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onDelete?: () => void
}) {
  const client = useQueryClient()
  const remove = useMutation({
    mutationFn: () => api.remove(board.id),
    onSuccess: async () => {
      await uncacheBoard(client, userId, board.id)
      onOpenChange(false)
      onDelete?.()
    },
  })
  const pending = remove.isPending
  const error = remove.error ? errorMessage(remove.error) : ''

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {board.title}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the board and its contents for everyone
            with access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => remove.mutate()}
          >
            {pending ? 'Deleting…' : 'Delete board'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
