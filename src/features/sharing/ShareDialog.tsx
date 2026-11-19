import { Input } from '@/components/ui/input'
import { LinkSimple, LockSimple } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useState, type RefObject } from 'react'
import { AccessManagement } from './AccessManagement'
import type { BoardSummary, InviteRole } from '@/shared/api/boards-client'
import { Button } from '@/components/ui/button'
import { useShareAccess } from './useShareAccess'

export function ShareDialog({
  userId,
  board,
  open,
  onOpenChange,
  returnFocus,
}: {
  userId: string
  board: BoardSummary
  open: boolean
  onOpenChange: (open: boolean) => void
  returnFocus: RefObject<HTMLButtonElement | null>
}) {
  const owner = board.role === 'owner'
  const [role, setRole] = useState<InviteRole>('editor')
  const share = useShareAccess(userId, board.id, open && owner)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        finalFocus={returnFocus}
        className="max-h-[calc(100dvh-2rem)] overflow-auto"
      >
        <DialogHeader>
          <DialogTitle>Share {board.title}</DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-3 border-b pt-5 pb-4">
          <LockSimple className="size-5 shrink-0" />
          <div>
            <strong className="text-base">Current access</strong>
            <DialogDescription>
              Private · Only members can open the board URL
            </DialogDescription>
          </div>
        </div>
        {owner && (
          <>
            <fieldset className="mt-3 mb-4">
              <legend className="mb-2 text-base font-bold">Invite link</legend>
              <RadioGroup
                value={role}
                onValueChange={(value) => setRole(value as InviteRole)}
              >
                <div className="flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <RadioGroupItem value="editor" aria-label="Can edit" /> Can
                    edit
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <RadioGroupItem value="viewer" aria-label="Can view" /> Can
                    view
                  </label>
                </div>
              </RadioGroup>
              <p className="mt-2.5 text-sm text-muted-foreground">
                Sign-in required
              </p>
            </fieldset>
            <Button
              size="lg"
              disabled={share.busy}
              onClick={() => void share.generate(role)}
            >
              <LinkSimple className="size-5" /> Copy invite link
            </Button>
            {share.notice && (
              <p className="mt-2 text-sm text-muted-foreground" role="status">
                {share.notice}
              </p>
            )}
            {share.link && (
              <div className="mt-2">
                <Input
                  aria-label="Generated invite link"
                  value={share.link}
                  readOnly
                  onFocus={(event) => event.currentTarget.select()}
                />
              </div>
            )}
            {share.error && (
              <p className="text-sm text-destructive" role="alert">
                {share.error}
              </p>
            )}
            <AccessManagement
              access={share.access}
              busy={share.busy}
              onRevokeInvite={share.revokeInvite}
              onRevokeMember={share.revokeMember}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
