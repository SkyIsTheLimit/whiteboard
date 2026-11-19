import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { onAuthChange } from '@/shared/api/auth-change'
import { sessionQuery, type BoardUser } from '@/shared/api/board-queries'
import { clearProtectedCache } from '@/shared/api/protected-cache'
import { ScreenStatus } from './ScreenStatus'

export function ProtectedSession({
  user,
  children,
}: {
  user: BoardUser
  children: ReactNode
}) {
  const client = useQueryClient()
  const [changing, setChanging] = useState(false)
  const { data, isError } = useQuery({
    ...sessionQuery,
    refetchOnMount: false,
    refetchOnWindowFocus: 'always',
    refetchInterval: 30_000,
  })
  const changed = data !== undefined && data?.id !== user.id

  useEffect(() => onAuthChange(() => setChanging(true)), [])

  useEffect(() => {
    if (!changing && !changed && !isError) return
    if (changing) client.clear()
    else clearProtectedCache(client)
    if (changing || changed) window.location.reload()
  }, [changed, changing, client, isError])

  // Unmount the workspace and close its socket before clearing old data or reloading.
  if (changing || changed) return <ScreenStatus>Checking sign-in…</ScreenStatus>
  if (isError)
    return (
      <main className="p-4">
        <ScreenStatus error>Could not verify your session.</ScreenStatus>
        <button
          type="button"
          className="text-primary underline"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </main>
    )
  return children
}
