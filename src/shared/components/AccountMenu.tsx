import { notifyAuthChange } from '@/shared/api/auth-change'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Export, Monitor, SignOut } from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { authClient } from '@/shared/api/auth-client'
import { useTheme, type Appearance } from '@/shared/hooks/useTheme'
import { ShareDialog } from '@/features/sharing/ShareDialog'
import type { BoardSummary } from '@/shared/api/boards-client'

export function AccountMenu({
  name,
  board,
  userId,
}: {
  name: string
  board?: BoardSummary
  userId?: string
}) {
  const client = useQueryClient()
  const { appearance, setAppearance } = useTheme()
  const [sharingBoard, setSharingBoard] = useState<string>()
  const trigger = useRef<HTMLButtonElement>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function signOut() {
    setPending(true)
    try {
      const result = await authClient.signOut()
      if (result.error)
        throw new Error(result.error.message ?? 'Sign out failed.')
      client.clear()
      notifyAuthChange()
      window.location.assign('/sign-in')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sign out failed.')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              ref={trigger}
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[#e8b878] bg-[#f9dfb8] text-xs/none font-bold text-[#583915]"
              aria-label={`Account menu for ${name}`}
              title={name}
            >
              {name.trim().slice(0, 1).toUpperCase()}
            </button>
          }
        />
        <DropdownMenuContent
          className="ring-border focus-visible:outline-none"
          align="end"
          sideOffset={8}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <span className="block max-w-60 truncate" title={name}>
                {name}
              </span>
            </DropdownMenuLabel>
            {board && (
              <DropdownMenuItem onClick={() => setSharingBoard(board.id)}>
                <Export /> Share
              </DropdownMenuItem>
            )}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Monitor /> Appearance
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="ring-border focus-visible:outline-none">
                <DropdownMenuRadioGroup
                  value={appearance}
                  onValueChange={(value) => setAppearance(value as Appearance)}
                >
                  <DropdownMenuRadioItem closeOnClick value="light">
                    Light
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem closeOnClick value="dark">
                    Dark
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem closeOnClick value="system">
                    System
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={pending}
              closeOnClick={false}
              onClick={() => void signOut()}
            >
              <SignOut className="size-4" /> Sign out
            </DropdownMenuItem>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {board && userId && (
        <ShareDialog
          key={board.id}
          userId={userId}
          board={board}
          open={sharingBoard === board.id}
          onOpenChange={(open) => setSharingBoard(open ? board.id : undefined)}
          returnFocus={trigger}
        />
      )}
    </>
  )
}
