import { describe, expect, it } from 'vitest'

import type { PhaseConfig } from '@grow-node/contracts'

import {
  evaluateZone,
  getActivePhase,
} from '../../src/decision/evaluate-zone.js'

const phaseConfig = {
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
      settleMinutes: 0,
    },
    humidity: {
      optimal: [88, 95],
      warning: [80, 98],
      settleMinutes: 50,
    },
    illuminance: {
      optimal: [1800, 4500],
      warning: [800, 7000],
      settleMinutes: 0,
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
      settleMinutes: 0,
    },
    humidity: {
      optimal: [90, 97],
      warning: [85, 99],
      settleMinutes: 90,
    },
    illuminance: {
      optimal: [0, 10],
      warning: [0, 50],
      settleMinutes: 0,
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
} satisfies PhaseConfig

const plantProfile = {
  scheduleStartMinutes: 21 * 60,
  scheduleDurationMinutes: 8 * 60,
  phaseConfig,
}

describe('getActivePhase', () => {
  it('returns lightOn during the scheduled light period', () => {
    const result = getActivePhase({
      now: new Date(2026, 0, 1, 22, 0),
      scheduleStartMinutes: 21 * 60,
      scheduleDurationMinutes: 8 * 60,
    })

    expect(result).toBe('lightOn')
  })

  it('returns lightOff outside the scheduled light period', () => {
    const result = getActivePhase({
      now: new Date(2026, 0, 1, 10, 0),
      scheduleStartMinutes: 21 * 60,
      scheduleDurationMinutes: 8 * 60,
    })

    expect(result).toBe('lightOff')
  })
})

describe('evaluateZone', () => {
  it('returns normal when values are inside the active phase optimal ranges', () => {
    const result = evaluateZone({
      telemetry: {
        temperatureC: 23,
        humidityPct: 92,
        lightLux: 2500,
        estimatedPpfd: 50,
        vpdKpa: 0.25,
        condensationMarginC: 2,
        recordedAt: new Date(2026, 0, 1, 22, 0),
      },
      plantProfile,
    })

    expect(result.status).toBe('normal')
    expect(result.activePhase).toBe('lightOn')
    expect(result.reasons).toEqual([])
    expect(result.lightDesired).toBe(true)
  })

  it('returns warning when a value is outside optimal but inside warning range', () => {
    const result = evaluateZone({
      telemetry: {
        temperatureC: 27,
        humidityPct: 92,
        lightLux: 2500,
        recordedAt: new Date(2026, 0, 1, 22, 0),
      },
      plantProfile,
    })

    expect(result.status).toBe('warning')
    expect(result.reasons).toEqual([
      {
        metric: 'temperature',
        status: 'warning',
        value: 27,
        direction: 'high',
      },
    ])
  })

  it('returns danger when a value is outside warning range', () => {
    const result = evaluateZone({
      telemetry: {
        temperatureC: 30,
        humidityPct: 92,
        lightLux: 2500,
        recordedAt: new Date(2026, 0, 1, 22, 0),
      },
      plantProfile,
    })

    expect(result.status).toBe('danger')
    expect(result.reasons[0]).toMatchObject({
      metric: 'temperature',
      status: 'danger',
      value: 30,
      direction: 'high',
    })
  })

  it('requests heater when temperature is too low', () => {
    const result = evaluateZone({
      telemetry: {
        temperatureC: 17,
        humidityPct: 92,
        lightLux: 2500,
        recordedAt: new Date(2026, 0, 1, 22, 0),
      },
      plantProfile,
    })

    expect(result.status).toBe('danger')
    expect(result.heaterDesired).toBe(true)
  })

  it('softens warning range values to settling during the metric settle time', () => {
    const result = evaluateZone({
      telemetry: {
        temperatureC: 27,
        humidityPct: 92,
        lightLux: 2500,
        recordedAt: new Date(2026, 0, 1, 21, 10),
      },
      plantProfile,
    })

    expect(result.status).toBe('normal')
    expect(result.reasons).toEqual([
      {
        metric: 'temperature',
        status: 'settling',
        value: 27,
        direction: 'high',
      },
    ])
  })
})
