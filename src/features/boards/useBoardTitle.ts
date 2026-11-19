import { useNavigate, useSearch } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cacheBoard } from '@/shared/api/board-cache'
import { useEffect, useRef, useState } from 'react'
import {
  api,
  errorMessage,
  type BoardSummary,
} from '@/shared/api/boards-client'

export function useBoardTitle(userId: string, board: BoardSummary) {
  const client = useQueryClient()
  const rename = useMutation({
    mutationFn: (title: string) => api.rename(board.id, title),
    onSuccess: ({ board }) => cacheBoard(client, userId, board),
  })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(board.title)
  const [error, setError] = useState('')
  const stopped = useRef(false)
  const committing = useRef(false)
  const input = useRef<HTMLInputElement>(null)

  const navigate = useNavigate()
  const renameRequested = useSearch({
    from: '/boards/$boardId',
    select: (search) => search.rename === 1,
  })
  useEffect(() => {
    if (board.role !== 'owner' || !renameRequested) return
    setEditing(true)
    void navigate({
      to: '/boards/$boardId',
      params: { boardId: board.id },
      search: {},
      replace: true,
    })
  }, [board.id, board.role, navigate, renameRequested])

  useEffect(() => {
    if (editing) {
      input.current?.focus()
      input.current?.select()
    }
  }, [editing])

  function start() {
    stopped.current = false
    setError('')
    setDraft(board.title)
    setEditing(true)
  }

  function cancel() {
    stopped.current = true
    setEditing(false)
  }

  async function save() {
    if (stopped.current || committing.current) return
    const title = draft.trim()
    if (!title || title === board.title) {
      cancel()
      return
    }
    committing.current = true
    setError('')
    try {
      await rename.mutateAsync(title)
      setEditing(false)
    } catch (reason) {
      setError(errorMessage(reason))
      input.current?.focus()
    } finally {
      committing.current = false
    }
  }

  return { editing, draft, setDraft, error, input, start, cancel, save }
}
