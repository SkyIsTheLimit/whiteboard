import { Link, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ScreenStatus } from '@/shared/components/ScreenStatus'
import { errorMessage } from '@/shared/api/boards-client'

export function BoardLoadError({
  error,
  reset,
}: {
  error: unknown
  reset?: () => void
}) {
  const router = useRouter()
  return (
    <main className="space-y-3 p-4 pt-20">
      <ScreenStatus error>{errorMessage(error)}</ScreenStatus>
      {reset && (
        <Button
          variant="outline"
          onClick={() => void router.invalidate().then(reset)}
        >
          Retry
        </Button>
      )}
      <Link
        className="block text-primary underline underline-offset-3"
        to="/boards"
      >
        Go to Boards
      </Link>
    </main>
  )
}
