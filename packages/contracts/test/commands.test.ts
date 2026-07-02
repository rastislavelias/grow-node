import { describe, expect, it } from 'vitest'

import { commandPayloadSchema } from '../src/index.js'

describe('commandPayloadSchema', () => {
  it('accepts a valid command payload', () => {
    const result = commandPayloadSchema.safeParse({
      commandId: 'cmd-1',
      zoneId: 'zone-1',
      deviceId: 'device-1',
      type: 'set-output',
      payload: {
        fan: true,
        light: false,
      },
      createdAt: '2026-07-02T12:00:05.000Z',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid command payload values', () => {
    const result = commandPayloadSchema.safeParse({
      commandId: 'cmd-1',
      zoneId: 'zone-1',
      deviceId: 'device-1',
      type: 'set-output',
      payload: {
        fan: 'yes',
        light: false,
      },
      createdAt: '2026-07-02T12:00:05.000Z',
    })

    expect(result.success).toBe(false)
  })
})
