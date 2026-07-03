import { describe, expect, it } from 'vitest'

import { telemetryPayloadSchema } from '../src/index.js'

describe('telemetryPayloadSchema', () => {
  it('accepts a valid telemetry payload', () => {
    const result = telemetryPayloadSchema.safeParse({
      zoneId: 'zone-1',
      deviceId: 'device-1',
      temperatureC: 24.5,
      humidityPct: 92,
      lightLux: 2500,
      recordedAt: new Date().toISOString(),
    })

    expect(result.success).toBe(true)
  })

  it('accepts optional derived metrics', () => {
    const result = telemetryPayloadSchema.safeParse({
      zoneId: 'zone-1',
      deviceId: 'device-1',
      temperatureC: 24.5,
      humidityPct: 92,
      lightLux: 2500,
      estimatedPpfd: 55,
      vpdKpa: 0.25,
      condensationMarginC: 2,
      recordedAt: new Date().toISOString(),
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid humidity values', () => {
    const result = telemetryPayloadSchema.safeParse({
      zoneId: 'zone-1',
      deviceId: 'device-1',
      temperatureC: 24.5,
      humidityPct: 120,
      lightLux: 2500,
      recordedAt: new Date().toISOString(),
    })

    expect(result.success).toBe(false)
  })

  it('rejects unknown extra fields', () => {
    const result = telemetryPayloadSchema.safeParse({
      zoneId: 'zone-1',
      deviceId: 'device-1',
      temperatureC: 24.5,
      humidityPct: 92,
      lightLux: 2500,
      recordedAt: new Date().toISOString(),
      soilMoisturePct: 50,
    })

    expect(result.success).toBe(false)
  })
})
