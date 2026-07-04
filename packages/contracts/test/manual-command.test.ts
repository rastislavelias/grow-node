import { describe, expect, it } from 'vitest'

import { manualCommandRequestSchema } from '../src/index.js'

describe('manualCommandRequestSchema', () => {
  it('accepts a valid manual output command', () => {
    const result = manualCommandRequestSchema.safeParse({
      fan: true,
      light: false,
      heater: false,
    })

    expect(result.success).toBe(true)
  })

  it('rejects missing fan value', () => {
    const result = manualCommandRequestSchema.safeParse({
      light: false,
      heater: false,
    })

    expect(result.success).toBe(false)
  })

  it('rejects non-boolean output values', () => {
    const result = manualCommandRequestSchema.safeParse({
      fan: 'true',
      light: false,
      heater: false,
    })

    expect(result.success).toBe(false)
  })

  it('rejects unknown extra fields', () => {
    const result = manualCommandRequestSchema.safeParse({
      fan: true,
      light: false,
      heater: false,
      pump: true,
    })

    expect(result.success).toBe(false)
  })
})
