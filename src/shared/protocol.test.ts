import { describe, expect, it } from 'vitest'
import {
  elementsEqual,
  type BoardElement,
  type ConnectorElement,
} from './model'
import { parseClientMessage } from './protocol'

const rectangle: BoardElement = {
  id: 'rectangle',
  type: 'rectangle',
  x: 0,
  y: -12,
  width: 120,
  height: 60,
  label: 'Step',
  color: '#315ABD',
}

describe('board protocol', () => {
  it('validates element identity and revision preconditions', () => {
    const commit = {
      type: 'commit',
      id: 'test',
      changes: [{ id: 'rectangle', before: null, after: rectangle }],
    }
    expect(parseClientMessage(commit)).toEqual(commit)
    expect(
      parseClientMessage({
        ...commit,
        changes: [...commit.changes, ...commit.changes],
      }),
    ).toBeNull()
    expect(
      parseClientMessage({
        ...commit,
        changes: [{ id: 'other', before: rectangle, after: null }],
      }),
    ).toBeNull()
    expect(
      parseClientMessage({
        ...commit,
        changes: [{ id: 'rectangle', before: null, after: null }],
      }),
    ).toBeNull()
  })

  it('rejects nonfinite points and unusable shape sizes', () => {
    expect(
      parseClientMessage({ type: 'cursor', point: { x: Infinity, y: 0 } }),
    ).toBeNull()
    expect(
      parseClientMessage({
        type: 'commit',
        id: 'test',
        changes: [
          { id: 'rectangle', before: null, after: { ...rectangle, width: 0 } },
        ],
      }),
    ).toBeNull()
  })

  it('accepts exact hex lengths and portable connector stroke patterns', () => {
    const connector: ConnectorElement = {
      id: 'edge',
      type: 'connector',
      sourceId: 'source',
      targetId: 'target',
      label: '',
      color: '#284abc',
    }
    const parse = (element: BoardElement) =>
      parseClientMessage({
        type: 'commit',
        id: 'style',
        changes: [{ id: element.id, before: null, after: element }],
      })
    expect(parse({ ...connector, strokeStyle: 'dashed' })).not.toBeNull()
    expect(parse({ ...connector, strokeStyle: 'dotted' })).not.toBeNull()
    expect(
      parse({
        ...connector,
        strokeStyle: 'invalid',
      } as unknown as ConnectorElement),
    ).toBeNull()
    expect(parse({ ...connector, color: '#12345' })).toBeNull()
    expect(parse({ ...rectangle, color: '#1234567' })).toBeNull()
    expect(parse({ ...rectangle, color: 'gold' })).not.toBeNull()
    expect(
      elementsEqual(connector, { ...connector, strokeStyle: 'solid' }),
    ).toBe(true)
    expect(
      elementsEqual(connector, { ...connector, strokeStyle: 'dashed' }),
    ).toBe(false)
  })

  it('compares canonical element fields independently of key order', () => {
    const { color, ...rest } = rectangle
    expect(elementsEqual(rectangle, { color, ...rest })).toBe(true)
    expect(elementsEqual(rectangle, { ...rectangle, label: 'Changed' })).toBe(
      false,
    )
  })
})
