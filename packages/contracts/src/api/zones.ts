import { z } from 'zod'

import { zonePhaseSchema, zoneStatusSchema } from '../shared/status.js'
import { setOutputPayloadSchema } from '../mqtt/commands.js'

export const zoneStateReasonSchema = z
  .object({
    metric: z.string(),
    status: z.enum(['settling', 'warning', 'danger']),
    value: z.number(),
    direction: z.enum(['low', 'high', 'risk']),
  })
  .strict()

export const zoneOverviewSchema = z.object({
  id: z.string(),
  name: z.string(),
  controller: z.object({
    type: z.enum(['esp32', 'simulator']),
    firmwareVersion: z.string().nullable(),
    lastSeenAt: z.string().nullable(),
  }),
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

export const zoneResponseSchema = z.object({
  zone: zoneOverviewSchema,
})

export const telemetryReadingSchema = z.object({
  id: z.string(),
  zoneId: z.string(),
  temperatureC: z.number(),
  humidityPct: z.number(),
  lightLux: z.number(),
  estimatedPpfd: z.number().nullable(),
  vpdKpa: z.number().nullable(),
  condensationMarginC: z.number().nullable(),
  recordedAt: z.string(),
  createdAt: z.string(),
})

export const zoneTelemetryResponseSchema = z.object({
  readings: z.array(telemetryReadingSchema),
})

export const commandHistoryItemSchema = z.object({
  id: z.string(),
  zoneId: z.string(),
  source: z.enum(['manual', 'automatic']),
  type: z.enum(['set-output']),
  status: z.enum(['pending', 'published', 'acknowledged', 'failed']),
  payload: setOutputPayloadSchema,
  createdAt: z.string(),
  publishedAt: z.string().nullable(),
  acknowledgedAt: z.string().nullable(),
})

export const zoneCommandsResponseSchema = z.object({
  commands: z.array(commandHistoryItemSchema),
})

export type ZoneStateReason = z.infer<typeof zoneStateReasonSchema>
export type ZoneOverview = z.infer<typeof zoneOverviewSchema>
export type ZonesResponse = z.infer<typeof zonesResponseSchema>
export type ZoneResponse = z.infer<typeof zoneResponseSchema>
export type TelemetryReading = z.infer<typeof telemetryReadingSchema>
export type ZoneTelemetryResponse = z.infer<typeof zoneTelemetryResponseSchema>
export type CommandHistoryItem = z.infer<typeof commandHistoryItemSchema>
export type ZoneCommandsResponse = z.infer<typeof zoneCommandsResponseSchema>
