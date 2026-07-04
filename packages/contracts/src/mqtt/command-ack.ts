import { z } from 'zod'

export const commandAckPayloadSchema = z.object({
  commandId: z.string().min(1),
  zoneId: z.string().min(1),
  status: z.enum(['acknowledged', 'failed']),
  acknowledgedAt: z.iso.datetime(),
})

export type CommandAckPayload = z.infer<typeof commandAckPayloadSchema>
