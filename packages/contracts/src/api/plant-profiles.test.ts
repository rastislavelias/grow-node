import { describe, expect, it } from 'vitest'

import {
  plantProfileInUseResponseSchema,
  plantProfileInputSchema,
} from './plant-profiles.js'

const rangeMetric = {
  optimal: [20, 24],
  warning: [18, 26],
  settleMinutes: 30,
} as const

const phaseMetrics = {
  condensationMargin: {
    lowRiskMin: 1,
    mediumRiskMin: 0.3,
    scale: [0, 5],
    settleMinutes: 30,
  },
  estimatedPpfd: rangeMetric,
  humidity: rangeMetric,
  illuminance: rangeMetric,
  temperature: rangeMetric,
  vpd: rangeMetric,
} as const

const validPlantProfile = {
  name: "Anubias barteri 'Petite'",
  scheduleStartMinutes: 21 * 60,
  scheduleDurationMinutes: 8 * 60,
  phaseConfig: {
    lightOn: phaseMetrics,
    lightOff: phaseMetrics,
  },
}

describe('plantProfileInputSchema', () => {
  it('accepts a complete plant profile', () => {
    expect(plantProfileInputSchema.safeParse(validPlantProfile).success).toBe(
      true,
    )
  })

  it('rejects a schedule outside one day', () => {
    const result = plantProfileInputSchema.safeParse({
      ...validPlantProfile,
      scheduleStartMinutes: 1440,
    })

    expect(result.success).toBe(false)
  })

  it('rejects an invalid nested metric range', () => {
    const result = plantProfileInputSchema.safeParse({
      ...validPlantProfile,
      phaseConfig: {
        ...validPlantProfile.phaseConfig,
        lightOn: {
          ...validPlantProfile.phaseConfig.lightOn,
          temperature: {
            ...validPlantProfile.phaseConfig.lightOn.temperature,
            optimal: [26, 22],
          },
        },
      },
    })

    expect(result.success).toBe(false)
  })
})

describe('plantProfileInUseResponseSchema', () => {
  it('requires at least one affected zone', () => {
    const response = {
      error: 'Plant profile is in use',
      code: 'PLANT_PROFILE_IN_USE',
      zones: [{ id: 'zone-1', name: 'Anubias Zone 1' }],
    }

    expect(plantProfileInUseResponseSchema.safeParse(response).success).toBe(
      true,
    )
    expect(
      plantProfileInUseResponseSchema.safeParse({
        ...response,
        zones: [],
      }).success,
    ).toBe(false)
  })
})
