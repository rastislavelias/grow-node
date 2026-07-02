import { z } from 'zod'

export const telemetryPayloadSchema = z.object({
  zoneId: z.string().min(1),
  deviceId: z.string().min(1),
  temperatureC: z.number(),
  humidityPct: z.number().min(0).max(100),
  lightLux: z.number().min(0),
  recordedAt: z.iso.datetime(),
})

export type TelemetryPayload = z.infer<typeof telemetryPayloadSchema>
