import {
  CursorIcon,
  HandPalmIcon,
  LineSegmentIcon,
  TextTIcon,
} from '@phosphor-icons/react'
import type { Shape, Tool } from './editor-types'

import { CanvasToolButton } from './CanvasToolButton'
import { ShapePicker } from './ShapePicker'

const tools = [
  { tool: 'select', label: 'Select', key: 'V', Icon: CursorIcon },
  { tool: 'hand', label: 'Hand', key: 'H', Icon: HandPalmIcon },
  { tool: 'shape' },
  { tool: 'text', label: 'Text', key: 'T', Icon: TextTIcon },
  { tool: 'connector', label: 'Connector', key: 'C', Icon: LineSegmentIcon },
] as const

type Props = {
  tool: Tool
  setTool(tool: Tool): void
  shape: Shape
  setShape(shape: Shape): void
  readOnly?: boolean
  disabled?: boolean
}

export function DrawingToolbar({
  tool,
  setTool,
  shape,
  setShape,
  readOnly,
  disabled: locked,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border bg-background/5 p-1 backdrop-blur-2xl">
      <div
        className="flex items-center gap-1.5 shadow-sm max-[480px]:gap-0"
        role="group"
        aria-label="Drawing tools"
      >
        {tools.map((item) => {
          if (item.tool === 'shape') {
            return (
              <ShapePicker
                key="shape"
                shape={shape}
                onChange={setShape}
                label="Choose shape tool"
                active={!locked && tool === 'shape'}
                disabled={readOnly || locked}
              />
            )
          }
          const { tool: id, label, key, Icon } = item
          const disabled =
            locked || (readOnly && id !== 'select' && id !== 'hand')
          return (
            <CanvasToolButton
              key={id}
              label={label}
              shortcut={key}
              aria-pressed={!locked && tool === id}
              disabled={disabled}
              onClick={() => setTool(id)}
            >
              <Icon aria-hidden="true" />
            </CanvasToolButton>
          )
        })}
      </div>
    </div>
  )
}
