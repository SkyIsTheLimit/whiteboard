import { useEffect, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { opaqueHex } from '../shared/board-color'
import { connectorStroke, shapeFill } from './paint'

const presets = ['neutral', 'blue', 'green', 'gold', 'rose', 'purple'] as const

function pickerHex(value: string) {
  const rgb =
    value.length === 5 || value.length === 9
      ? value.slice(0, value.length === 5 ? -1 : -2)
      : value
  return opaqueHex(rgb) ?? '#000000'
}

type Props = {
  target: { id: string; kind: 'fill' | 'stroke' }
  color: string
  dark: boolean
  onPreview: (id: string, color?: string) => void
  onApply: (color: string) => void
}

export function ElementColorPicker({
  target: { id, kind },
  color,
  dark,
  onPreview,
  onApply,
}: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string>()
  const [hex, setHex] = useState('')
  const resolve = (value: string) =>
    kind === 'fill' ? shapeFill(value, dark) : connectorStroke(value, dark)
  const valid = opaqueHex(hex)
  const label = kind === 'fill' ? 'Fill color' : 'Stroke color'

  useEffect(() => () => onPreview(id), [id, onPreview])

  function changeOpen(next: boolean) {
    setOpen(next)
    setDraft(undefined)
    if (next) setHex(pickerHex(resolve(color)))
    else onPreview(id)
  }

  function change(value: string, input = resolve(value)) {
    setHex(input)
    setDraft(value)
    onPreview(id, value)
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            title={label}
          >
            <span
              aria-hidden="true"
              className="size-4 rounded-sm border border-foreground/50"
              style={{
                backgroundColor: resolve(open && draft ? draft : color),
              }}
            />
          </Button>
        }
      />
      <PopoverContent
        align="start"
        sideOffset={8}
        className="ring-border focus-visible:outline-none"
      >
        <PopoverTitle>{label}</PopoverTitle>
        <div aria-label="Color presets" role="group" className="flex gap-1">
          {presets.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={(draft ?? color) === preset ? 'default' : 'ghost'}
              size="icon"
              aria-label={preset[0].toUpperCase() + preset.slice(1)}
              aria-pressed={(draft ?? color) === preset}
              onClick={() => change(preset)}
            >
              <span
                aria-hidden="true"
                className="size-4 rounded-sm border border-foreground/50"
                style={{ backgroundColor: resolve(preset) }}
              />
            </Button>
          ))}
        </div>
        <HexColorPicker
          color={pickerHex(resolve(draft ?? color))}
          onChange={(value) => change(value, value)}
          className="h-36! w-full!"
        />
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!draft || !valid) return
            onApply(draft)
            changeOpen(false)
          }}
        >
          <label className="grid min-w-0 flex-1 gap-1">
            <span>Hex</span>
            <Input
              type="text"
              value={hex}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={!valid}
              onChange={(event) => {
                const input = event.currentTarget.value
                const value = opaqueHex(input)
                if (value) change(value, input)
                else {
                  setHex(input)
                  setDraft(undefined)
                  onPreview(id)
                }
              }}
            />
          </label>
          <Button type="submit" disabled={!draft || !valid || draft === color}>
            Apply
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
