import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  CopyIcon,
  PaletteIcon,
  TrashIcon,
} from '@phosphor-icons/react'
import type { CanvasHandle, Shape } from './editor-types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Button } from '@/components/ui/button'
import { CanvasToolButton } from './CanvasToolButton'
import { ConnectorStrokeButtons } from './ConnectorStrokeButtons'
import type { ConnectorStrokeStyle } from '../shared/model'
import { ElementColorPicker } from './ElementColorPicker'
import { Separator } from '@/components/ui/separator'
import { ShapePicker } from './ShapePicker'

const colors = ['neutral', 'blue', 'green', 'gold', 'rose', 'purple']
const colorSwatches = [
  'bg-[#9b9993]',
  'bg-[#8dafff]',
  'bg-[#9cb68c]',
  'bg-[#e3b85f]',
  'bg-[#db92a5]',
  'bg-[#bc96da]',
]

type Props = {
  dark?: boolean
  color: string
  colorTarget?: { id: string; kind: 'fill' | 'stroke' }
  onColorPreview: (id: string, color?: string) => void
  actions: CanvasHandle
  connectorStyle?: ConnectorStrokeStyle
  onConnectorStyleChange: (style: ConnectorStrokeStyle) => void
  selected: boolean
  selectedShape?: Shape
  onChangeSelectedShape: (shape: Shape) => void
  onUndo?(): void
  onRedo?(): void
  canUndo?: boolean
  canRedo?: boolean
}

export function EditToolbar({
  dark = false,
  color,
  colorTarget,
  onColorPreview,
  connectorStyle,
  onConnectorStyleChange,
  actions,
  selected,
  selectedShape,
  onChangeSelectedShape,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: Props) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border bg-primary/10 px-0.5 py-0.5 backdrop-blur-2xl max-sm:gap-1"
      role="group"
      aria-label="Element actions"
    >
      {selectedShape && (
        <ShapePicker
          shape={selectedShape}
          onChange={onChangeSelectedShape}
          label="Change selected shape"
        />
      )}
      {connectorStyle && (
        <ConnectorStrokeButtons
          value={connectorStyle}
          onChange={onConnectorStyleChange}
        />
      )}
      {(selectedShape || connectorStyle) && (
        <Separator orientation="vertical" />
      )}
      {colorTarget ? (
        <ElementColorPicker
          key={colorTarget.id}
          target={colorTarget}
          color={color}
          dark={dark}
          onPreview={onColorPreview}
          onApply={actions.setColor}
        />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Element color"
                title="Element color"
              >
                <PaletteIcon />
              </Button>
            }
          />
          <DropdownMenuContent
            className="ring-border focus-visible:outline-none"
            sideOffset={8}
          >
            <DropdownMenuRadioGroup
              value={color}
              onValueChange={actions.setColor}
            >
              {colors.map((name, i) => (
                <DropdownMenuRadioItem key={name} value={name} closeOnClick>
                  <span
                    className={`block size-3.5 rounded-full ${colorSwatches[i]}`}
                  />{' '}
                  {name[0].toUpperCase() + name.slice(1)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {selected && (
        <CanvasToolButton
          label="Duplicate selection"
          onClick={actions.duplicate}
        >
          <CopyIcon className="size-4" />
        </CanvasToolButton>
      )}
      {selected && (
        <CanvasToolButton
          label="Delete selection"
          onClick={actions.deleteSelected}
        >
          <TrashIcon className="size-4" />
        </CanvasToolButton>
      )}
      <CanvasToolButton label="Undo" disabled={!canUndo} onClick={onUndo}>
        <ArrowCounterClockwiseIcon className="size-4" />
      </CanvasToolButton>
      <CanvasToolButton label="Redo" disabled={!canRedo} onClick={onRedo}>
        <ArrowClockwiseIcon className="size-4" />
      </CanvasToolButton>
    </div>
  )
}
