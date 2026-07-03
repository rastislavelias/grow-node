import { z } from 'zod'

import { zoneStatusSchema } from '../shared/status.js'

export const zoneOverviewSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: z
    .object({
      status: zoneStatusSchema,
      fanDesired: z.boolean(),
      lightDesired: z.boolean(),
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
      recordedAt: z.string(),
    })
    .nullable(),
})

export const zonesResponseSchema = z.object({
  zones: z.array(zoneOverviewSchema),
})

export type ZoneOverview = z.infer<typeof zoneOverviewSchema>
export type ZonesResponse = z.infer<typeof zonesResponseSchema>
