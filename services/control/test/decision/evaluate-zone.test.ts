import { describe, expect, it } from 'vitest'

import { evaluateZone } from '../../src/decision/evaluate-zone.js'

const baseTelemetry = {
  zoneId: 'zone-1',
  deviceId: 'device-1',
  temperatureC: 24,
  humidityPct: 60,
  soilMoisturePct: 50,
  lightLux: 500,
  recordedAt: '2026-07-02T12:00:00.000Z',
}

const profile = {
  minTemperatureC: 18,
  maxTemperatureC: 28,
  minHumidityPct: 45,
  maxHumidityPct: 75,
  minSoilMoisturePct: 35,
  maxSoilMoisturePct: 80,
  minLightLux: 200,
  maxLightLux: 900,
}

describe('evaluateZone', () => {
  it('returns normal status when telemetry is within thresholds', () => {
    const result = evaluateZone(baseTelemetry, profile)

    expect(result).toEqual({
      status: 'normal',
      fanDesired: false,
      lightDesired: false,
      reasons: [],
    })
  })

  it('turns fan on when temperature is too high', () => {
    const result = evaluateZone(
      {
        ...baseTelemetry,
        temperatureC: 30,
      },
      profile,
    )

    expect(result.status).toBe('warning')
    expect(result.fanDesired).toBe(true)
    expect(result.lightDesired).toBe(false)
    expect(result.reasons).toContain('temperature-too-high')
  })

  it('returns critical status when temperature is far above maximum', () => {
    const result = evaluateZone(
      {
        ...baseTelemetry,
        temperatureC: 32,
      },
      profile,
    )

    expect(result.status).toBe('critical')
    expect(result.fanDesired).toBe(true)
    expect(result.reasons).toContain('temperature-too-high')
  })

  it('turns light on when light level is too low', () => {
    const result = evaluateZone(
      {
        ...baseTelemetry,
        lightLux: 100,
      },
      profile,
    )

    expect(result.status).toBe('warning')
    expect(result.lightDesired).toBe(true)
    expect(result.reasons).toContain('light-too-low')
  })
})
