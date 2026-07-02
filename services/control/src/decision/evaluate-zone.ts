import type { TelemetryPayload, ZoneStatus } from '@grow-node/contracts'

type PlantProfileThresholds = {
  minTemperatureC: number
  maxTemperatureC: number
  minHumidityPct: number
  maxHumidityPct: number
  minLightLux: number
  maxLightLux: number
}

export type ZoneDecision = {
  status: ZoneStatus
  fanDesired: boolean
  lightDesired: boolean
  reasons: string[]
}

export function evaluateZone(
  telemetry: TelemetryPayload,
  profile: PlantProfileThresholds,
): ZoneDecision {
  const reasons: string[] = []

  const temperatureTooHigh = telemetry.temperatureC > profile.maxTemperatureC
  const temperatureCritical =
    telemetry.temperatureC > profile.maxTemperatureC + 3

  const humidityTooHigh = telemetry.humidityPct > profile.maxHumidityPct
  const humidityTooLow = telemetry.humidityPct < profile.minHumidityPct

  const lightTooLow = telemetry.lightLux < profile.minLightLux

  if (temperatureTooHigh) {
    reasons.push('temperature-too-high')
  }

  if (humidityTooHigh) {
    reasons.push('humidity-too-high')
  }

  if (humidityTooLow) {
    reasons.push('humidity-too-low')
  }

  if (lightTooLow) {
    reasons.push('light-too-low')
  }

  const status: ZoneStatus = temperatureCritical
    ? 'critical'
    : reasons.length > 0
      ? 'warning'
      : 'normal'

  return {
    status,
    fanDesired: temperatureTooHigh || humidityTooHigh,
    lightDesired: lightTooLow,
    reasons,
  }
}
