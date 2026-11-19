const authChangeKey = 'whiteboard.auth-change'

export function notifyAuthChange() {
  try {
    localStorage.setItem(authChangeKey, crypto.randomUUID())
  } catch {
    // Focus and periodic session checks still work without local storage.
  }
}

export function onAuthChange(listener: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === authChangeKey) listener()
  }
  function onPageShow(event: PageTransitionEvent) {
    if (event.persisted) listener()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener('pageshow', onPageShow)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('pageshow', onPageShow)
  }
}
