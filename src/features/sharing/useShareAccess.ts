import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { accessQuery } from '@/shared/api/board-queries'
import { isCurrentUser } from '@/shared/api/board-cache'
import { api, errorMessage, type InviteRole } from '@/shared/api/boards-client'

type ShareChange =
  | { type: 'invite'; role: InviteRole }
  | { type: 'revoke-invite' | 'revoke-member'; id: string }

export function useShareAccess(userId: string, boardId: string, open: boolean) {
  const client = useQueryClient()
  const query = accessQuery(userId, boardId)
  const { data: access, error: accessError } = useQuery({
    ...query,
    enabled: open,
  })
  const [notice, setNotice] = useState('')
  const [link, setLink] = useState('')
  const change = useMutation({
    gcTime: 0,
    mutationFn: async (action: ShareChange) => {
      if (action.type === 'invite') return api.invite(boardId, action.role)
      if (action.type === 'revoke-invite')
        await api.revokeInvite(boardId, action.id)
      else await api.revokeMember(boardId, action.id)
    },
    onMutate: () => {
      setNotice('')
      setLink('')
    },
    onSuccess: async (result, action) => {
      if (!isCurrentUser(client, userId)) return
      await client.invalidateQueries({ queryKey: query.queryKey, exact: true })
      if (!isCurrentUser(client, userId)) return
      if (result) {
        const absolute = new URL(result.url, window.location.origin).href
        try {
          await navigator.clipboard.writeText(absolute)
          setNotice('Invite link copied.')
        } catch {
          setLink(absolute)
          setNotice('Invite link created. Copy it below.')
        }
      } else {
        setNotice(
          action.type === 'revoke-invite'
            ? 'Invite link revoked.'
            : 'Member access removed.',
        )
      }
    },
  })
  const error = change.error ?? accessError
  return {
    access: access ?? null,
    busy: change.isPending,
    error: error ? errorMessage(error) : '',
    notice,
    link,
    generate: (role: InviteRole) => change.mutate({ type: 'invite', role }),
    revokeInvite: (id: string) => change.mutate({ type: 'revoke-invite', id }),
    revokeMember: (id: string) => change.mutate({ type: 'revoke-member', id }),
  }
}
