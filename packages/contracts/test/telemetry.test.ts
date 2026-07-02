import { describe, expect, it } from 'vitest'

import { telemetryPayloadSchema } from '../src/index.js'

describe('telemetryPayloadSchema', () => {
  it('accepts a valid telemetry payload', () => {
    const result = telemetryPayloadSchema.safeParse({
      zoneId: 'zone-1',
      deviceId: 'device-1',
      temperatureC: 24.5,
      humidityPct: 61,
      soilMoisturePct: 42,
      lightLux: 380,
      recordedAt: '2026-07-02T12:00:00.000Z',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid humidity values', () => {
    const result = telemetryPayloadSchema.safeParse({
      zoneId: 'zone-1',
      deviceId: 'device-1',
      temperatureC: 24.5,
      humidityPct: 150,
      soilMoisturePct: 42,
      lightLux: 380,
      recordedAt: '2026-07-02T12:00:00.000Z',
    })

    expect(result.success).toBe(false)
  })
})
