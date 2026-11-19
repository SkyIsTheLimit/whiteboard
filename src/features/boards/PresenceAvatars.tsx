import type { CSSProperties } from 'react'
import type { Presence } from '@/shared/protocol'
import { presenceColorToken } from '@/shared/presence-palette'

export function PresenceAvatars({
  presence,
  userId,
}: {
  presence: Presence[]
  userId: string
}) {
  const peers = [
    ...new Map(
      presence
        .filter((peer) => peer.userId !== userId)
        .map((peer) => [peer.userId, peer]),
    ).values(),
  ]
  if (!peers.length) return null
  return (
    <>
      <div className="flex -space-x-1" aria-label="Collaborators online">
        {peers.slice(0, 3).map((peer) => (
          <span
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-2 border-[color:var(--peer-color)] bg-[color-mix(in_oklab,var(--peer-color)_20%,var(--board-panel))] text-xs/none font-bold text-foreground max-[680px]:size-6 max-[680px]:text-xs"
            title={peer.name}
            aria-label={peer.name}
            key={peer.userId}
            style={
              {
                '--peer-color': `var(${presenceColorToken(peer.cursorSlot)})`,
              } as CSSProperties
            }
          >
            {peer.name.trim().slice(0, 1).toUpperCase()}
          </span>
        ))}
        {peers.length > 3 && (
          <span
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted text-xs/none font-bold text-foreground max-[680px]:size-6 max-[680px]:text-xs"
            aria-label={`${peers.length - 3} more collaborators`}
          >
            +{peers.length - 3}
          </span>
        )}
      </div>
      <span className="h-6 w-px bg-border" aria-hidden="true" />
    </>
  )
}
