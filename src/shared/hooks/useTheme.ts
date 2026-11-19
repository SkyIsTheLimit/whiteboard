import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'
export type Appearance = Theme | 'system'
const changeEvent = 'whiteboard-theme-change'
const themeKey = 'whiteboard.theme'
let temporaryAppearance: Appearance | undefined

function readAppearance(): Appearance {
  if (temporaryAppearance) return temporaryAppearance
  try {
    const preference = localStorage.getItem(themeKey)
    if (preference === 'light' || preference === 'dark') return preference
  } catch {
    // Use the system preference when browser storage is unavailable.
  }
  return 'system'
}

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function applyAppearance() {
  const appearance = readAppearance()
  const system = matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
  document.documentElement.dataset.theme =
    appearance === 'system' ? system : appearance
  window.dispatchEvent(new Event(changeEvent))
}

function subscribe(callback: () => void) {
  const media = matchMedia('(prefers-color-scheme: dark)')
  function syncStorage(event: StorageEvent) {
    if (event.key !== null && event.key !== themeKey) return
    temporaryAppearance = undefined
    applyAppearance()
  }
  window.addEventListener(changeEvent, callback)
  window.addEventListener('storage', syncStorage)
  media.addEventListener('change', applyAppearance)
  if (!document.documentElement.dataset.theme) applyAppearance()
  return () => {
    window.removeEventListener(changeEvent, callback)
    window.removeEventListener('storage', syncStorage)
    media.removeEventListener('change', applyAppearance)
  }
}

function setAppearance(appearance: Appearance) {
  try {
    if (appearance === 'system') localStorage.removeItem(themeKey)
    else localStorage.setItem(themeKey, appearance)
    temporaryAppearance = undefined
  } catch {
    temporaryAppearance = appearance
  }
  applyAppearance()
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    currentTheme,
    () => 'light' as Theme,
  )
  const appearance = useSyncExternalStore(
    subscribe,
    readAppearance,
    () => 'system' as Appearance,
  )
  return {
    theme,
    appearance,
    setAppearance,
    toggleTheme: () => setAppearance(theme === 'light' ? 'dark' : 'light'),
  }
}
