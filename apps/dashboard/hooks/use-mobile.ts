import * as React from 'react'

const MOBILE_BREAKPOINT = 768
const mobileMediaQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobileMediaQuery,
    getMobileSnapshot,
    getServerMobileSnapshot,
  )
}

function subscribeToMobileMediaQuery(onChange: () => void) {
  const mediaQuery = window.matchMedia(mobileMediaQuery)

  mediaQuery.addEventListener('change', onChange)

  return () => {
    mediaQuery.removeEventListener('change', onChange)
  }
}

function getMobileSnapshot() {
  return window.matchMedia(mobileMediaQuery).matches
}

function getServerMobileSnapshot() {
  return false
}
