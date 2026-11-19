import type { CanvasHandle, Shape, Tool } from './editor-types'

import type { ConnectorStrokeStyle } from '../shared/model'
import { DrawingToolbar } from './DrawingToolbar'
import { EditToolbar } from './EditToolbar'
import { TooltipProvider } from '@/components/ui/tooltip'

type Props = {
  tool: Tool
  setTool(tool: Tool): void
  shape: Shape
  setShape(shape: Shape): void
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
  readOnly?: boolean
  onUndo?(): void
  onRedo?(): void
  canUndo?: boolean
  canRedo?: boolean
}

export function CanvasToolbar({
  tool,
  setTool,
  shape,
  setShape,
  readOnly,
  ...editProps
}: Props) {
  const showEditToolbar =
    !readOnly &&
    (editProps.selected ||
      tool === 'shape' ||
      tool === 'text' ||
      tool === 'connector')

  return (
    <TooltipProvider delay={300}>
      <div className="absolute top-0 left-0 z-10 m-2 flex flex-col items-start gap-2 p-2">
        <DrawingToolbar
          tool={tool}
          setTool={setTool}
          shape={shape}
          setShape={setShape}
          readOnly={readOnly}
        />
        {showEditToolbar && <EditToolbar {...editProps} />}
      </div>
    </TooltipProvider>
  )
}
