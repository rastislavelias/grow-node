import type { HeartbeatPayload, TelemetryPayload } from '@grow-node/contracts'

type SimulatedZone = {
  zoneId: string
  firmwareVersion: string
}

const scheduleStartMinutes = 21 * 60
const scheduleDurationMinutes = 8 * 60
const minutesPerDay = 24 * 60

function randomBetween(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(2))
}

function getMinutesAfterMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

function isLightOn(date: Date): boolean {
  const currentMinutes = getMinutesAfterMidnight(date)
  const scheduleEndMinutes =
    (scheduleStartMinutes + scheduleDurationMinutes) % minutesPerDay

  const crossesMidnight =
    scheduleStartMinutes + scheduleDurationMinutes >= minutesPerDay

  return crossesMidnight
    ? currentMinutes >= scheduleStartMinutes ||
        currentMinutes < scheduleEndMinutes
    : currentMinutes >= scheduleStartMinutes &&
        currentMinutes < scheduleEndMinutes
}

export function createTelemetry(zone: SimulatedZone): TelemetryPayload {
  const recordedAt = new Date()
  const lightOn = isLightOn(recordedAt)

  if (lightOn) {
    return {
      zoneId: zone.zoneId,
      temperatureC: randomBetween(22.5, 26),
      humidityPct: randomBetween(88, 95),
      lightLux: randomBetween(1800, 4500),
      estimatedPpfd: randomBetween(30, 75),
      vpdKpa: randomBetween(0.15, 0.4),
      condensationMarginC: randomBetween(1.5, 3),
      recordedAt: recordedAt.toISOString(),
    }
  }

  return {
    zoneId: zone.zoneId,
    temperatureC: randomBetween(20, 24),
    humidityPct: randomBetween(90, 97),
    lightLux: randomBetween(0, 10),
    estimatedPpfd: randomBetween(0, 0.2),
    vpdKpa: randomBetween(0.08, 0.3),
    condensationMarginC: randomBetween(1, 2),
    recordedAt: recordedAt.toISOString(),
  }
}

export function createHeartbeat(zone: SimulatedZone): HeartbeatPayload {
  return {
    zoneId: zone.zoneId,
    status: 'online',
    firmwareVersion: zone.firmwareVersion,
    seenAt: new Date().toISOString(),
  }
}
