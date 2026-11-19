import { presencePaletteIndex } from '@/shared/presence-palette'
import { isHexColor, opaqueHex } from '../shared/board-color'
import type { Point } from '../shared/model'
import type { Presence } from '../shared/protocol'
import {
  connectorLabelPoint,
  connectorPath,
  contains,
  handles,
  intersects,
  pathBounds,
  ports,
  toWorld,
  type Bounds,
  type Camera,
  type NodeElement,
  type Size,
} from './geometry'
import { portRadius } from './connector-ports'
import type { Anchor } from './editor-types'
import { selectionBounds, type Scene } from './scene'

const palettes = {
  light: {
    background: '#F5F2EB',
    fill: '#FCFAF5',
    ink: '#20201e',
    stroke: '#777671',
    dot: '#79726936',
    accent: '#315ABD',
    marquee: '#315ABD20',
  },
  dark: {
    background: '#1E1D1B',
    fill: '#292724',
    ink: '#f4f1eb',
    stroke: '#d7d1c8',
    dot: '#ede5d32e',
    accent: '#9BB5FF',
    marquee: '#9BB5FF30',
  },
}
type Palette = typeof palettes.light

const colors: Record<string, [string, string, string, string]> = {
  blue: ['#dfe8ff', '#315abd', '#313f64', '#a7bfff'],
  green: ['#dfedde', '#54754a', '#304432', '#bad7a7'],
  gold: ['#f7e8c7', '#8b651c', '#4c3c20', '#f2cd82'],
  rose: ['#f6dfe4', '#a25365', '#4f343c', '#ffb5c3'],
  purple: ['#efe2fb', '#805aa4', '#473855', '#dfbdfc'],
}

export function shapeFill(color: string, dark: boolean) {
  if (isHexColor(color)) return color
  const swatch = colors[color]
  return swatch ? swatch[dark ? 2 : 0] : palettes[dark ? 'dark' : 'light'].fill
}

export function connectorStroke(
  color: string,
  dark: boolean,
  fallback = palettes[dark ? 'dark' : 'light'].stroke,
) {
  if (isHexColor(color)) return color
  return colors[color]?.[dark ? 3 : 1] ?? fallback
}

function customFillInk(color: string, fallback: string) {
  const hex = color.startsWith('#') && opaqueHex(color)
  if (!hex) return fallback
  const luminance = [0.2126, 0.7152, 0.0722].reduce((sum, weight, index) => {
    const offset = 1 + index * 2
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255
    return (
      sum +
      weight *
        (channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4)
    )
  }, 0)
  return luminance > 0.179 ? '#000000' : '#ffffff'
}

function roundRect(ctx: CanvasRenderingContext2D, box: Bounds, radius: number) {
  ctx.beginPath()
  ctx.roundRect(box.x, box.y, box.width, box.height, radius)
}

function line(ctx: CanvasRenderingContext2D, points: readonly Point[]) {
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y)
  ctx.stroke()
}

function drawDots(
  ctx: CanvasRenderingContext2D,
  size: Size,
  camera: Camera,
  palette: Palette,
) {
  // Keep the grid stationary in world coordinates while adapting density across zoom levels.
  let spacing = 20 * camera.zoom
  while (spacing < 12) spacing *= 2
  while (spacing > 42) spacing /= 2
  ctx.fillStyle = palette.dot
  for (let y = camera.y % spacing; y < size.height; y += spacing) {
    for (let x = camera.x % spacing; x < size.width; x += spacing)
      ctx.fillRect(x, y, 1, 1)
  }
}

function splitLines(
  ctx: CanvasRenderingContext2D,
  label: string,
  width: number,
): string[] {
  return label.split('\n').flatMap((paragraph) => {
    const result: string[] = []
    let row = ''
    for (const word of paragraph.split(/\s+/)) {
      const next = row ? row + ' ' + word : word
      if (row && ctx.measureText(next).width > width) {
        result.push(row)
        row = word
      } else row = next
    }
    result.push(row)
    return result
  })
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: NodeElement,
  palette: Palette,
  dark: boolean,
  label: boolean,
  minLineWidth = 0,
) {
  const { x, y, width: w, height: h, type } = node
  const swatch = colors[node.color]
  const ink = swatch ? swatch[dark ? 3 : 1] : palette.stroke
  if (type !== 'text') {
    ctx.fillStyle = shapeFill(node.color, dark)
    ctx.strokeStyle = ink
    ctx.lineWidth = Math.max(1.35, minLineWidth)
    ctx.beginPath()
    if (type === 'ellipse')
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
    if (type === 'rectangle')
      ctx.roundRect(x, y, w, h, Math.min(w / 2, h / 2, 8))
    if (type === 'diamond') {
      ctx.moveTo(x + w / 2, y)
      ctx.lineTo(x + w, y + h / 2)
      ctx.lineTo(x + w / 2, y + h)
      ctx.lineTo(x, y + h / 2)
      ctx.closePath()
    }
    ctx.fill()
    ctx.stroke()
  }
  if (!label || !node.label) return
  ctx.font = '600 17px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle =
    type === 'text'
      ? swatch
        ? ink
        : palette.ink
      : customFillInk(node.color, palette.ink)
  const width = Math.max(12, w * (type === 'diamond' ? 0.54 : 0.88))
  const lines = splitLines(ctx, node.label, width).slice(
    0,
    Math.max(1, Math.floor(h / 20)),
  )
  const top = y + h / 2 - (lines.length - 1) * 10
  lines.forEach((text, index) =>
    ctx.fillText(text, x + w / 2, top + index * 20, width),
  )
}

type PaintOptions = {
  dark?: boolean
  preview?: boolean
  selected?: ReadonlySet<string>
  marquee?: Bounds | null
  draft?: NodeElement | null
  connector?: readonly Point[] | null
  showPorts?: boolean
  connectorSource?: Anchor
  connectorTarget?: Anchor
  presence?: readonly Presence[]
  presencePalette?: readonly { color: string; foreground: string }[]
  editing?: string | null
  colorPreview?: { id: string; color: string }
  pixelRatio: number
}

export function paint(
  ctx: CanvasRenderingContext2D,
  size: Size,
  camera: Camera,
  scene: Scene,
  options: PaintOptions,
) {
  const theme = options.dark ? palettes.dark : palettes.light
  const palette = options.preview
    ? {
        ...theme,
        background: options.dark ? '#252320' : '#faf7f0',
        stroke: options.dark ? '#e5dfd4' : '#696560',
      }
    : theme
  const { width, height } = size
  const ratio = options.pixelRatio
  if (
    ctx.canvas.width !== Math.round(width * ratio) ||
    ctx.canvas.height !== Math.round(height * ratio)
  ) {
    ctx.canvas.width = Math.round(width * ratio)
    ctx.canvas.height = Math.round(height * ratio)
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.fillStyle = palette.background
  ctx.fillRect(0, 0, width, height)
  if (!options.preview) drawDots(ctx, size, camera, palette)
  const start = toWorld({ x: 0, y: 0 }, camera)
  const viewport = {
    ...start,
    width: width / camera.zoom,
    height: height / camera.zoom,
  }
  ctx.translate(camera.x, camera.y)
  ctx.scale(camera.zoom, camera.zoom)
  const minLineWidth = options.preview ? 1.35 / camera.zoom : 0
  const selectedConnectorEnds: Point[] = []
  const colorFor = (element: { id: string; color: string }) =>
    options.colorPreview?.id === element.id && options.selected?.has(element.id)
      ? options.colorPreview.color
      : element.color
  for (const connector of scene.connectors) {
    const path = connectorPath(connector, scene.nodes)
    if (!path || !intersects(pathBounds(path), viewport)) continue
    const end = path[path.length - 1]
    const next = path[path.length - 2]
    const angle = Math.atan2(end.y - next.y, end.x - next.x)
    const wing = (offset: number) => ({
      x: end.x - 10 * Math.cos(angle + offset),
      y: end.y - 10 * Math.sin(angle + offset),
    })
    const arrow = [wing(0.53), end, wing(-0.53)]
    ctx.lineJoin = 'round'
    if (options.selected?.has(connector.id)) {
      ctx.save()
      ctx.strokeStyle = palette.accent
      ctx.globalAlpha = 0.25
      ctx.lineWidth = Math.max(1.65, minLineWidth) + 4 / camera.zoom
      line(ctx, path)
      line(ctx, arrow)
      ctx.restore()
      selectedConnectorEnds.push(path[0], end)
    }
    ctx.strokeStyle = connectorStroke(
      colorFor(connector),
      !!options.dark,
      palette.stroke,
    )
    ctx.lineWidth = Math.max(1.65, minLineWidth)
    if (
      connector.strokeStyle === 'dashed' ||
      connector.strokeStyle === 'dotted'
    ) {
      ctx.save()
      const spacing = Math.max(1 / camera.zoom, ctx.lineWidth)
      if (connector.strokeStyle === 'dotted') {
        ctx.lineCap = 'round'
        ctx.setLineDash([0, 4 * spacing])
      } else {
        ctx.setLineDash([7 * spacing, 4 * spacing])
      }
      line(ctx, path)
      ctx.restore()
    } else line(ctx, path)
    line(ctx, arrow)
    if (connector.label && !options.preview) {
      const { x, y } = connectorLabelPoint(path)
      ctx.font = '600 13px system-ui, sans-serif'
      const w = ctx.measureText(connector.label).width + 12
      roundRect(ctx, { x: x - w / 2, y: y - 8, width: w, height: 16 }, 4)
      ctx.fillStyle = palette.fill
      ctx.fill()
      ctx.fillStyle = palette.ink
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(connector.label, x, y)
    }
  }
  for (const node of scene.nodes.values()) {
    if (!intersects(node, viewport)) continue
    const color = colorFor(node)
    drawNode(
      ctx,
      color === node.color ? node : { ...node, color },
      palette,
      !!options.dark,
      !options.preview && options.editing !== node.id,
      minLineWidth,
    )
  }
  for (const point of selectedConnectorEnds) {
    ctx.beginPath()
    ctx.arc(point.x, point.y, 3.5 / camera.zoom, 0, Math.PI * 2)
    ctx.strokeStyle = palette.accent
    ctx.lineWidth = 1.25 / camera.zoom
    ctx.stroke()
  }
  if (options.draft) drawNode(ctx, options.draft, palette, !!options.dark, true)
  ctx.strokeStyle = palette.accent
  ctx.lineWidth = 1.3 / camera.zoom
  if (options.connector) line(ctx, options.connector)
  if (options.marquee) {
    ctx.fillStyle = palette.marquee
    const { x, y, width, height } = options.marquee
    ctx.fillRect(x, y, width, height)
    ctx.strokeRect(x, y, width, height)
  }
  const box = options.selected && selectionBounds(scene, options.selected)
  if (box) {
    ctx.strokeRect(box.x, box.y, box.width, box.height)
    const handleSize = 7 / camera.zoom
    ctx.fillStyle = palette.fill
    for (const [, point] of handles(box)) {
      const handle = {
        x: point.x - handleSize / 2,
        y: point.y - handleSize / 2,
        width: handleSize,
        height: handleSize,
      }
      roundRect(ctx, handle, 1.4 / camera.zoom)
      ctx.fill()
      ctx.stroke()
    }
  }
  if (options.showPorts) {
    ctx.strokeStyle = palette.accent
    ctx.lineWidth = 1.5 / camera.zoom
    for (const node of scene.nodes.values()) {
      if (node.type === 'text' || !intersects(node, viewport)) continue
      for (const [side, point] of ports(node)) {
        const source = options.connectorSource
        const target = options.connectorTarget
        const active =
          (source?.id === node.id && source.side === side) ||
          (target?.id === node.id && target.side === side)
        ctx.beginPath()
        ctx.arc(
          point.x,
          point.y,
          (active ? portRadius + 2 : portRadius) / camera.zoom,
          0,
          2 * Math.PI,
        )
        ctx.fillStyle = active ? palette.accent : palette.fill
        ctx.fill()
        ctx.stroke()
      }
    }
  }
  for (const peer of options.presence ?? []) {
    if (!peer.point || !contains(viewport, peer.point, 100 / camera.zoom))
      continue
    const colors =
      options.presencePalette?.[presencePaletteIndex(peer.cursorSlot)]
    if (colors?.color && colors.foreground)
      drawCursor(ctx, peer, camera.zoom, palette, colors)
  }
}

function drawCursor(
  ctx: CanvasRenderingContext2D,
  peer: Presence,
  zoom: number,
  palette: Palette,
  colors: { color: string; foreground: string },
) {
  ctx.save()
  ctx.translate(peer.point!.x, peer.point!.y)
  ctx.scale(1 / zoom, 1 / zoom)
  ctx.fillStyle = colors.color
  ctx.strokeStyle = palette.fill
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(6, 21)
  ctx.lineTo(10, 12)
  ctx.lineTo(19, 10)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.font = '600 12px system-ui, sans-serif'
  const name = peer.name.slice(0, 30)
  const width = ctx.measureText(name).width + 14
  roundRect(ctx, { x: 15, y: 17, width, height: 20 }, 5)
  ctx.fill()
  ctx.fillStyle = colors.foreground
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(name, 22, 27)
  ctx.restore()
}
