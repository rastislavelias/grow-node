import { z } from 'zod'

export const telemetryPayloadSchema = z
  .object({
    zoneId: z.string().min(1),
    deviceId: z.string().min(1),

    temperatureC: z.number(),
    humidityPct: z.number().min(0).max(100),
    lightLux: z.number().min(0),

    estimatedPpfd: z.number().min(0).optional(),
    vpdKpa: z.number().min(0).optional(),
    condensationMarginC: z.number().optional(),

    recordedAt: z.iso.datetime(),
  })
  .strict()

export type TelemetryPayload = z.infer<typeof telemetryPayloadSchema>
