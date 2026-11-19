import {
  CaretDownIcon,
  CircleIcon,
  DiamondIcon,
  SquareIcon,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Shape } from './editor-types'

const shapes = [
  { type: 'rectangle', label: 'Rectangle', Icon: SquareIcon },
  { type: 'ellipse', label: 'Ellipse', Icon: CircleIcon },
  { type: 'diamond', label: 'Diamond', Icon: DiamondIcon },
] as const

export function ShapePicker({
  shape,
  onChange,
  label,
  active,
  disabled,
}: {
  shape: Shape
  onChange: (shape: Shape) => void
  label: string
  active?: boolean
  disabled?: boolean
}) {
  const current = shapes.find((item) => item.type === shape) ?? shapes[0]
  const trigger = (
    <DropdownMenuTrigger
      render={
        <Button
          type="button"
          variant={active ? 'default' : 'ghost'}
          size={active === undefined ? 'sm' : 'lg'}
          aria-label={label + ', current shape ' + current.label}
          title={active === undefined ? label : undefined}
          disabled={disabled}
          aria-pressed={active}
        >
          <current.Icon aria-hidden="true" />
          <CaretDownIcon className="size-3" aria-hidden="true" />
        </Button>
      }
    />
  )
  return (
    <DropdownMenu>
      {active === undefined ? (
        trigger
      ) : (
        <Tooltip>
          <TooltipTrigger render={trigger} />
          <TooltipContent side="bottom" sideOffset={8}>
            {label} · {current.label}
          </TooltipContent>
        </Tooltip>
      )}
      <DropdownMenuContent
        className="ring-border focus-visible:outline-none"
        sideOffset={8}
        align="start"
      >
        <DropdownMenuRadioGroup
          value={shape}
          onValueChange={
            active === undefined
              ? (value) => onChange(value as Shape)
              : undefined
          }
        >
          {shapes.map(({ type, label, Icon }) => (
            // Creation must re-arm even when the selected radio value does not change.
            <DropdownMenuRadioItem
              key={type}
              value={type}
              closeOnClick
              onClick={active === undefined ? undefined : () => onChange(type)}
            >
              <Icon aria-hidden="true" /> {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
