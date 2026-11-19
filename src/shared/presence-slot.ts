export function isCursorSlot(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

export function firstFreeCursorSlot(taken: ReadonlySet<number>) {
  let slot = 1
  while (taken.has(slot)) slot += 1
  return slot
}
