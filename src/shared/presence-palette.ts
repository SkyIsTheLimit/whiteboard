export const presencePaletteSize = 5

export function presencePaletteIndex(slot: number) {
  return (slot - 1) % presencePaletteSize
}

export function presenceColorToken(slot: number) {
  return `--presence-color-${presencePaletteIndex(slot) + 1}`
}

export function readPresencePalette(element: HTMLElement) {
  const styles = getComputedStyle(element)
  const foreground = styles.getPropertyValue('--presence-foreground').trim()
  return Array.from({ length: presencePaletteSize }, (_, index) => ({
    color: styles.getPropertyValue(presenceColorToken(index + 1)).trim(),
    foreground,
  }))
}
