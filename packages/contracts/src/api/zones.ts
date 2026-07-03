import { z } from 'zod'

import { zonePhaseSchema, zoneStatusSchema } from '../shared/status.js'

export const zoneStateReasonSchema = z
  .object({
    metric: z.string(),
    status: z.enum(['warning', 'danger']),
    value: z.number(),
    direction: z.enum(['low', 'high', 'risk']),
  })
  .strict()

export const zoneOverviewSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: z
    .object({
      status: zoneStatusSchema,
      activePhase: zonePhaseSchema,
      fanDesired: z.boolean(),
      lightDesired: z.boolean(),
      heaterDesired: z.boolean(),
      reasons: z.array(zoneStateReasonSchema),
      lastTelemetryAt: z.string().nullable(),
      lastEvaluatedAt: z.string().nullable(),
    })
    .nullable(),
  devices: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      lastSeenAt: z.string().nullable(),
    }),
  ),
  latestTelemetry: z
    .object({
      temperatureC: z.number(),
      humidityPct: z.number(),
      lightLux: z.number(),
      estimatedPpfd: z.number().nullable(),
      vpdKpa: z.number().nullable(),
      condensationMarginC: z.number().nullable(),
      recordedAt: z.string(),
    })
    .nullable(),
})

export const zonesResponseSchema = z.object({
  zones: z.array(zoneOverviewSchema),
})

export type ZoneStateReason = z.infer<typeof zoneStateReasonSchema>
export type ZoneOverview = z.infer<typeof zoneOverviewSchema>
export type ZonesResponse = z.infer<typeof zonesResponseSchema>
