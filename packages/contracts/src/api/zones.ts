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

export const metricKeySchema = z.enum([
  'temperature',
  'humidity',
  'illuminance',
  'estimatedPpfd',
  'vpd',
  'condensationMargin',
])

export const metricStateSchema = z.enum([
  'optimal',
  'settling',
  'warning',
  'danger',
  'unknown',
])

export const metricDirectionSchema = z.enum(['low', 'high', 'risk']).nullable()

export const numericRangeSchema = z.tuple([z.number(), z.number()])

export const rangeMetricConfigViewSchema = z
  .object({
    kind: z.literal('range'),
    optimal: numericRangeSchema,
    warning: numericRangeSchema,
    scale: numericRangeSchema.nullable(),
    settleMinutes: z.number().int().nonnegative(),
  })
  .strict()

export const riskMetricConfigViewSchema = z
  .object({
    kind: z.literal('risk'),
    lowRiskMin: z.number(),
    mediumRiskMin: z.number(),
    scale: numericRangeSchema,
    settleMinutes: z.number().int().nonnegative(),
  })
  .strict()

export const metricConfigViewSchema = z.discriminatedUnion('kind', [
  rangeMetricConfigViewSchema,
  riskMetricConfigViewSchema,
])

export const zoneMetricViewSchema = z
  .object({
    key: metricKeySchema,
    label: z.string(),
    value: z.number().nullable(),
    unit: z.string(),
    precision: z.number().int().nonnegative(),
    state: metricStateSchema,
    direction: metricDirectionSchema,
    range: metricConfigViewSchema,
  })
  .strict()

export const zoneMetricEvaluationViewSchema = z
  .object({
    activePhase: zonePhaseSchema,
    metrics: z.array(zoneMetricViewSchema),
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
  zone: zoneOverviewSchema.extend({
    plantProfile: z.object({
      id: z.string(),
      name: z.string(),
    }),
  }),
  metricEvaluation: zoneMetricEvaluationViewSchema,
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
export type MetricKey = z.infer<typeof metricKeySchema>
export type MetricState = z.infer<typeof metricStateSchema>
export type MetricDirection = z.infer<typeof metricDirectionSchema>
export type MetricConfigView = z.infer<typeof metricConfigViewSchema>
export type ZoneMetricView = z.infer<typeof zoneMetricViewSchema>
export type ZoneMetricEvaluationView = z.infer<
  typeof zoneMetricEvaluationViewSchema
>
