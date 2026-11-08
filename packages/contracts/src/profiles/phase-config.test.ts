import { describe, expect, it } from 'vitest'

import {
  condensationMarginConfigSchema,
  phaseConfigSchema,
} from './phase-config.js'

describe('phaseConfigSchema', () => {
  it('accepts light on and light off phase configuration', () => {
    const result = phaseConfigSchema.safeParse({
      lightOn: {
        condensationMargin: {
          lowRiskMin: 1.5,
          mediumRiskMin: 0.5,
          scale: [0, 5],
          settleMinutes: 60,
        },
        estimatedPpfd: {
          optimal: [30, 75],
          warning: [13, 115],
          settleMinutes: 5,
        },
        humidity: {
          optimal: [88, 95],
          warning: [80, 98],
          settleMinutes: 50,
        },
        illuminance: {
          optimal: [1800, 4500],
          warning: [800, 7000],
          settleMinutes: 5,
        },
        temperature: {
          optimal: [22, 26],
          warning: [20, 28],
          settleMinutes: 35,
        },
        vpd: {
          optimal: [0.15, 0.4],
          warning: [0.08, 0.65],
          scale: [0, 0.78],
          settleMinutes: 50,
        },
      },
      lightOff: {
        condensationMargin: {
          lowRiskMin: 1,
          mediumRiskMin: 0.3,
          scale: [0, 3],
          settleMinutes: 90,
        },
        estimatedPpfd: {
          optimal: [0, 0.2],
          warning: [0, 1],
          settleMinutes: 5,
        },
        humidity: {
          optimal: [90, 97],
          warning: [85, 99],
          settleMinutes: 90,
        },
        illuminance: {
          optimal: [0, 10],
          warning: [0, 50],
          settleMinutes: 5,
        },
        temperature: {
          optimal: [20, 24],
          warning: [18, 26],
          settleMinutes: 60,
        },
        vpd: {
          optimal: [0.08, 0.3],
          warning: [0.03, 0.5],
          scale: [0, 0.6],
          settleMinutes: 90,
        },
      },
    })

    expect(result.success).toBe(true)
  })

  it('rejects reversed ranges', () => {
    const result = phaseConfigSchema.safeParse({
      lightOn: {
        condensationMargin: {
          lowRiskMin: 1.5,
          mediumRiskMin: 0.5,
          scale: [0, 5],
          settleMinutes: 60,
        },
        estimatedPpfd: {
          optimal: [75, 30],
          warning: [13, 115],
          settleMinutes: 5,
        },
        humidity: {
          optimal: [88, 95],
          warning: [80, 98],
          settleMinutes: 50,
        },
        illuminance: {
          optimal: [1800, 4500],
          warning: [800, 7000],
          settleMinutes: 5,
        },
        temperature: {
          optimal: [22, 26],
          warning: [20, 28],
          settleMinutes: 35,
        },
        vpd: {
          optimal: [0.15, 0.4],
          warning: [0.08, 0.65],
          scale: [0, 0.78],
          settleMinutes: 50,
        },
      },
      lightOff: {
        condensationMargin: {
          lowRiskMin: 1,
          mediumRiskMin: 0.3,
          scale: [0, 3],
          settleMinutes: 90,
        },
        estimatedPpfd: {
          optimal: [0, 0.2],
          warning: [0, 1],
          settleMinutes: 5,
        },
        humidity: {
          optimal: [90, 97],
          warning: [85, 99],
          settleMinutes: 90,
        },
        illuminance: {
          optimal: [0, 10],
          warning: [0, 50],
          settleMinutes: 5,
        },
        temperature: {
          optimal: [20, 24],
          warning: [18, 26],
          settleMinutes: 60,
        },
        vpd: {
          optimal: [0.08, 0.3],
          warning: [0.03, 0.5],
          scale: [0, 0.6],
          settleMinutes: 90,
        },
      },
    })

    expect(result.success).toBe(false)
  })
})

describe('condensationMarginConfigSchema', () => {
  it('rejects a scale that cannot display every risk band', () => {
    const result = condensationMarginConfigSchema.safeParse({
      lowRiskMin: 1,
      mediumRiskMin: 0.3,
      scale: [0, 0.5],
      settleMinutes: 90,
    })

    expect(result.success).toBe(false)
  })

  it('rejects risk thresholds in the wrong order', () => {
    const result = condensationMarginConfigSchema.safeParse({
      lowRiskMin: 0.3,
      mediumRiskMin: 1,
      scale: [0, 3],
      settleMinutes: 90,
    })

    expect(result.success).toBe(false)
  })
})
