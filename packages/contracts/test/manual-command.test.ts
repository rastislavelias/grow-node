import { describe, expect, it } from 'vitest'

import { manualCommandRequestSchema } from '../src/index.js'

describe('manualCommandRequestSchema', () => {
  it('accepts a valid manual fan and light command', () => {
    const result = manualCommandRequestSchema.safeParse({
      fan: true,
      light: false,
    })

    expect(result.success).toBe(true)
  })

  it('rejects missing fan value', () => {
    const result = manualCommandRequestSchema.safeParse({
      light: false,
    })

    expect(result.success).toBe(false)
  })

  it('rejects non-boolean output values', () => {
    const result = manualCommandRequestSchema.safeParse({
      fan: 'true',
      light: false,
    })

    expect(result.success).toBe(false)
  })

  it('rejects unknown extra fields', () => {
    const result = manualCommandRequestSchema.safeParse({
      fan: true,
      light: false,
      pump: true,
    })

    expect(result.success).toBe(false)
  })
})
