import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function CanvasToolButton({
  label,
  shortcut,
  variant,
  ...props
}: ComponentProps<typeof Button> & {
  label: string
  shortcut?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant={
              variant ?? (props['aria-pressed'] === true ? 'default' : 'ghost')
            }
            size="icon"
            aria-label={label}
            aria-keyshortcuts={shortcut}
            {...props}
          />
        }
      />
      <TooltipContent side="bottom" sideOffset={8}>
        {label}
        {shortcut ? ` (${shortcut})` : ''}
      </TooltipContent>
    </Tooltip>
  )
}
