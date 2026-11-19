import type { RefObject } from 'react'
import type { Point } from '../shared/model'
import type { Presence } from '../shared/protocol'
import type { Bounds, NodeElement } from './geometry'
import type { Anchor } from './editor-types'
import type { Scene } from './scene'

export type Transient = {
  scene?: Scene
  colorPreview?: { id: string; color: string }
  marquee?: Bounds
  draft?: NodeElement
  connector?: readonly Point[]
  connectorSource?: Anchor
  connectorTarget?: Anchor
}

export type PaintState = {
  scene: Scene
  transient: RefObject<Transient>
  selected: ReadonlySet<string>
  dark?: boolean
  showPorts?: boolean
  presence?: readonly Presence[]
  editing?: string
}
