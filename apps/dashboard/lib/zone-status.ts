import type { ZoneOverview } from '@grow-node/contracts'

export type ZoneStatus = 'normal' | 'warning' | 'danger' | 'unknown'
export type Tone = 'ok' | 'warning' | 'danger' | 'unknown'

export function getOverviewHealth({
  zoneStatus,
  controllerOnline,
  readingTone,
}: {
  zoneStatus: ZoneStatus
  controllerOnline: boolean
  readingTone: Tone
}): {
  label: string
  tone: Tone
} {
  if (zoneStatus === 'danger') {
    return {
      label: 'Danger',
      tone: 'danger',
    }
  }

  if (zoneStatus === 'warning') {
    return {
      label: 'Warning',
      tone: 'warning',
    }
  }

  if (!controllerOnline) {
    return {
      label: 'Attention',
      tone: 'warning',
    }
  }

  if (readingTone === 'warning') {
    return {
      label: 'Stale reading',
      tone: 'warning',
    }
  }

  if (readingTone === 'unknown') {
    return {
      label: 'No data',
      tone: 'unknown',
    }
  }

  if (zoneStatus === 'unknown') {
    return {
      label: 'Unknown',
      tone: 'unknown',
    }
  }

  return {
    label: 'Normal',
    tone: 'ok',
  }
}

export function getZoneStatus(zone: ZoneOverview): ZoneStatus {
  return zone.state?.status ?? 'unknown'
}

export function isRecentlySeen(
  value: string | null,
  staleAfterMs: number,
): boolean {
  if (!value) {
    return false
  }

  return Date.now() - new Date(value).getTime() <= staleAfterMs
}

export function getFreshnessTone(
  value: string | null,
  staleAfterMs: number,
): Tone {
  if (!value) {
    return 'unknown'
  }

  return isRecentlySeen(value, staleAfterMs) ? 'ok' : 'warning'
}

export function getControllerLabel(
  type: ZoneOverview['controller']['type'],
): string {
  if (type === 'esp32') {
    return 'ESP32'
  }

  return 'Simulator'
}
