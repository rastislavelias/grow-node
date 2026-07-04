import { z } from 'zod'

import { controllerStatusSchema } from '../shared/status.js'

export const heartbeatPayloadSchema = z
  .object({
    zoneId: z.string().min(1),
    status: controllerStatusSchema,
    firmwareVersion: z.string().min(1).optional(),
    seenAt: z.iso.datetime(),
  })
  .strict()

export type HeartbeatPayload = z.infer<typeof heartbeatPayloadSchema>
