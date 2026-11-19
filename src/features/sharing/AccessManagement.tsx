import { CaretDown } from '@phosphor-icons/react'
import type { ShareAccess } from '@/shared/api/boards-client'
import { Button } from '@/components/ui/button'

const roleName = {
  owner: 'Owner',
  editor: 'Can edit',
  viewer: 'Can view',
} as const

export function AccessManagement({
  access,
  busy,
  onRevokeInvite,
  onRevokeMember,
}: {
  access: ShareAccess | null
  busy: boolean
  onRevokeInvite: (id: string) => void
  onRevokeMember: (id: string) => void
}) {
  return (
    <details className="group mt-2.5 text-sm text-muted-foreground">
      <summary className="inline-flex list-none items-center gap-1.5 [&::-webkit-details-marker]:hidden">
        Manage access <CaretDown className="size-3.5 group-open:rotate-180" />
      </summary>
      {!access && <p role="status">Loading access…</p>}
      {access && (
        <>
          <h3 className="mt-2.5 mb-1 text-sm font-bold text-foreground">
            Members
          </h3>
          <ul>
            {access.members.map((member) => (
              <li
                className="flex items-center justify-between gap-2 py-1 text-foreground first:min-h-6"
                key={member.id}
              >
                <span>
                  {member.name}{' '}
                  <small className="block text-xs text-muted-foreground">
                    {roleName[member.role]}
                  </small>
                </span>
                {member.role !== 'owner' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    aria-label={`Remove access for ${member.name}`}
                    onClick={() => onRevokeMember(member.id)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <h3 className="mt-2.5 mb-1 text-sm font-bold text-foreground">
            Active invite links
          </h3>
          {access.invites.length === 0 && <p>No active invite links.</p>}
          <ul>
            {access.invites.map((invite) => (
              <li
                className="flex items-center justify-between gap-2 py-1 text-foreground first:min-h-6"
                key={invite.id}
              >
                <span>
                  {roleName[invite.role]}{' '}
                  <small className="block text-xs text-muted-foreground">
                    {new Date(invite.createdAt).toLocaleString()}
                  </small>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  aria-label={`Revoke ${roleName[invite.role].toLowerCase()} invite from ${new Date(invite.createdAt).toLocaleString()}`}
                  onClick={() => onRevokeInvite(invite.id)}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </details>
  )
}
