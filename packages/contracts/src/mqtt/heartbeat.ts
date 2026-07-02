import { z } from 'zod'

import { deviceStatusSchema } from '../shared/status.js'

export const heartbeatPayloadSchema = z.object({
  zoneId: z.string().min(1),
  deviceId: z.string().min(1),
  status: deviceStatusSchema,
  firmwareVersion: z.string().min(1),
  seenAt: z.iso.datetime(),
})

export type HeartbeatPayload = z.infer<typeof heartbeatPayloadSchema>
