import type { Point } from '../shared/model'
import type { Anchor } from './editor-types'
import { ports, type NodeElement } from './geometry'

export const portRadius = 4
export const portHitRadius = 14

export function nearestPort(
  nodes: ReadonlyMap<string, NodeElement>,
  point: Point,
  zoom: number,
  excludedId?: string,
): Anchor | null {
  // Hit and draw radii are specified in screen pixels, independent of the camera zoom.
  let limit = portHitRadius / zoom
  let nearest: Anchor | null = null
  for (const node of nodes.values()) {
    if (node.id === excludedId || node.type === 'text') continue
    for (const [side, port] of ports(node)) {
      const distance = Math.hypot(point.x - port.x, point.y - port.y)
      if (distance > limit) continue
      limit = distance
      nearest = { id: node.id, side, point: port }
    }
  }
  return nearest
}
