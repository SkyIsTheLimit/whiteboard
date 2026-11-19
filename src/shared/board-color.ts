export function isHexColor(value: string) {
  return /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)
}

export function opaqueHex(value: string) {
  const digits = value.trim().replace(/^#/, '').toLowerCase()
  if (/^[\da-f]{3}$/.test(digits)) {
    return '#' + [...digits].map((digit) => digit.repeat(2)).join('')
  }
  return /^[\da-f]{6}$/.test(digits) ? '#' + digits : undefined
}
