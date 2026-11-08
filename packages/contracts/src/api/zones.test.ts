import { describe, expect, it } from 'vitest'

import { createZoneRequestSchema, updateZoneRequestSchema } from './zones.js'

const validZoneInput = {
  name: 'Propagation Zone',
  controllerType: 'esp32',
  controllerFirmwareVersion: 'esp32-1.0.0',
  plantProfileId: 'profile-1',
}

describe('zone management contracts', () => {
  it('accepts a valid zone registration', () => {
    expect(
      createZoneRequestSchema.parse({
        id: 'propagation-zone-1',
        ...validZoneInput,
      }),
    ).toEqual({
      id: 'propagation-zone-1',
      ...validZoneInput,
    })
  })

  it.each(['Zone-1', 'zone_1', '-zone-1', 'zone--1', 'zone 1'])(
    'rejects invalid MQTT zone ID %s',
    (id) => {
      expect(
        createZoneRequestSchema.safeParse({
          id,
          ...validZoneInput,
        }).success,
      ).toBe(false)
    },
  )

  it('keeps the zone ID out of update requests', () => {
    expect(
      updateZoneRequestSchema.safeParse({
        id: 'replacement-id',
        ...validZoneInput,
      }).success,
    ).toBe(false)
  })
})
