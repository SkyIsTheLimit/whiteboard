import {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react'
import type { BoardElement } from '../shared/model'
import { CanvasToolbar } from './CanvasToolbar'
import { LabelEditor } from './LabelEditor'
import { ZoomControls } from './ZoomControls'
import {
  changeShape,
  deleteChanges,
  duplicateChanges,
  updateChanges,
} from './editor-actions'
import type { CanvasHandle, EditorProps, Shape, Tool } from './editor-types'
import { connectorLabelPoint, connectorPath, type Bounds } from './geometry'
import { handleCanvasKey } from './keyboard'
import { makeScene, type Scene } from './scene'
import { useCanvasView } from './useCanvasView'
import { usePointerEditor } from './usePointerEditor'
import type { Transient } from './view-types'

export type { CanvasHandle } from './editor-types'

function labelBounds(element: BoardElement, scene: Scene): Bounds | null {
  if (element.type !== 'connector') return element
  const path = connectorPath(element, scene.nodes)
  if (!path) return null
  const { x, y } = connectorLabelPoint(path)
  return { x: x - 64, y: y - 14, width: 128, height: 28 }
}

export function BoardCanvas({
  elements,
  presence,
  title,
  dark,
  readOnly,
  onCommit,
  onCursor,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  ref,
}: EditorProps & { ref?: Ref<CanvasHandle> }) {
  const [activeTool, setActiveTool] = useState<Tool>('select')
  const [shape, setShapeKind] = useState<Shape>('rectangle')
  const [color, setDefaultColor] = useState('neutral')
  const [selected, select] = useState<Set<string>>(() => new Set())
  const [editing, setEditing] = useState<BoardElement | null>(null)
  const tool = readOnly && activeTool !== 'hand' ? 'select' : activeTool
  const scene = useMemo(() => makeScene(elements), [elements])
  const transient = useRef<Transient>({})
  const editTarget = editing && (scene.byId.get(editing.id) ?? editing)
  const view = useCanvasView({
    scene,
    transient,
    selected,
    dark,
    presence,
    showPorts: tool === 'connector' && !readOnly,
    editing: editTarget?.id,
  })
  const { redraw } = view
  const previewColor = useCallback(
    (id: string, color?: string) => {
      if (color) transient.current.colorPreview = { id, color }
      else if (transient.current.colorPreview?.id === id)
        delete transient.current.colorPreview
      redraw()
    },
    [redraw],
  )
  const pointer = usePointerEditor({
    view,
    scene,
    transient,
    selected,
    select,
    tool,
    setTool: setActiveTool,
    shape,
    color,
    edit: setEditing,
    readOnly,
    onCommit,
    onCursor,
  })
  const selectedElement =
    selected.size === 1
      ? scene.byId.get(selected.values().next().value!)
      : undefined
  const selectedShape =
    selectedElement &&
    selectedElement.type !== 'connector' &&
    selectedElement.type !== 'text'
      ? selectedElement
      : undefined
  const box = editTarget && labelBounds(editTarget, scene)

  function setTool(next: Tool) {
    pointer.reset()
    if (next !== 'select') select(new Set())
    setActiveTool(next)
  }

  function setShape(next: Shape) {
    setShapeKind(next)
    setTool('shape')
  }

  function finishLabel(label?: string) {
    setEditing(null)
    const current = editing && scene.byId.get(editing.id)
    if (
      !readOnly &&
      current &&
      label !== undefined &&
      label !== current.label
    ) {
      onCommit([
        { id: current.id, before: current, after: { ...current, label } },
      ])
    }
  }

  const actions: CanvasHandle = {
    fit: view.fit,
    zoomTo: view.zoomTo,
    renameSelected() {
      if (!readOnly && selectedElement) setEditing(selectedElement)
    },
    setColor(value) {
      if (readOnly) return
      setDefaultColor(value)
      const changes = updateChanges(scene, selected, (element) =>
        element.color === value ? element : { ...element, color: value },
      )
      if (changes.length) onCommit(changes)
    },
    duplicate() {
      if (readOnly) return
      const changes = duplicateChanges(scene, selected)
      if (!changes.length) return
      onCommit(changes)
      select(new Set(changes.map((change) => change.id)))
    },
    deleteSelected() {
      if (readOnly) return
      const changes = deleteChanges(scene, selected)
      if (!changes.length) return
      onCommit(changes)
      select(new Set())
    },
  }
  useImperativeHandle(ref, () => actions)
  return (
    <div
      ref={view.viewRef}
      className="relative min-h-0 min-w-0 flex-auto overflow-hidden bg-(--board-bg) text-foreground"
    >
      <canvas
        data-slot="board-canvas"
        className="absolute inset-0 size-full touch-none outline-none select-none focus-visible:outline-2 focus-visible:-outline-offset-3 focus-visible:outline-primary data-[tool=connector]:cursor-crosshair data-[tool=hand]:cursor-grab data-[tool=shape]:cursor-crosshair data-[tool=text]:cursor-text"
        data-tool={tool}
        ref={view.canvasRef}
        tabIndex={0}
        role="application"
        aria-label={title ? title + ' board canvas' : 'Board canvas'}
        onPointerDown={pointer.down}
        onPointerMove={pointer.move}
        onPointerUp={pointer.end}
        onPointerCancel={pointer.reset}
        onLostPointerCapture={pointer.cancelGesture}
        onPointerLeave={pointer.cursorLeave}
        onDoubleClick={pointer.doubleClick}
        onBlur={() => {
          pointer.space.current = false
        }}
        onKeyUp={(event) => {
          if (event.key === ' ') pointer.space.current = false
        }}
        onKeyDown={(event) =>
          handleCanvasKey(event, {
            actions,
            readOnly,
            onUndo,
            onRedo,
            setTool,
            setShape,
            zoomBy: (factor) => view.zoomTo(view.zoom * factor),
            selectAll: () => select(new Set(scene.byId.keys())),
            clear: () => {
              select(new Set())
              setTool('select')
            },
            setSpace: (held) => {
              pointer.space.current = held
            },
          })
        }
      >
        {elements.length} elements. Press V for Select, H for Hand, R for
        Rectangle, T for Text, or C for Connector.
      </canvas>
      {!readOnly && box && editTarget && (
        <LabelEditor
          key={editTarget.id}
          element={editTarget}
          box={box}
          camera={view.camera.current}
          onFinish={finishLabel}
        />
      )}
      <CanvasToolbar
        dark={dark}
        tool={tool}
        setTool={setTool}
        shape={shape}
        setShape={setShape}
        color={selectedElement?.color ?? color}
        colorTarget={
          selectedElement && selectedElement.type !== 'text'
            ? {
                id: selectedElement.id,
                kind: selectedElement.type === 'connector' ? 'stroke' : 'fill',
              }
            : undefined
        }
        onColorPreview={previewColor}
        connectorStyle={
          selectedElement?.type === 'connector'
            ? (selectedElement.strokeStyle ?? 'solid')
            : undefined
        }
        onConnectorStyleChange={(strokeStyle) => {
          if (
            readOnly ||
            selectedElement?.type !== 'connector' ||
            (selectedElement.strokeStyle ?? 'solid') === strokeStyle
          )
            return
          onCommit([
            {
              id: selectedElement.id,
              before: selectedElement,
              after: { ...selectedElement, strokeStyle },
            },
          ])
        }}
        actions={actions}
        selected={selected.size > 0}
        readOnly={readOnly}
        selectedShape={selectedShape?.type}
        onChangeSelectedShape={(next) => {
          if (readOnly || !selectedShape) return
          const changes = changeShape(scene, selectedShape.id, next)
          if (changes.length) onCommit(changes)
        }}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <ZoomControls zoom={view.zoom} zoomTo={view.zoomTo} fit={view.fit} />
    </div>
  )
}
