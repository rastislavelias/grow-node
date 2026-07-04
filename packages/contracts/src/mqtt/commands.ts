import { z } from 'zod'

export const commandTypeSchema = z.enum(['set-output'])
export type CommandType = z.infer<typeof commandTypeSchema>

export const setOutputPayloadSchema = z
  .object({
    fan: z.boolean(),
    light: z.boolean(),
    heater: z.boolean(),
  })
  .strict()

export type SetOutputPayload = z.infer<typeof setOutputPayloadSchema>

export const commandPayloadSchema = z
  .object({
    commandId: z.string().min(1),
    zoneId: z.string().min(1),
    type: commandTypeSchema,
    payload: setOutputPayloadSchema,
    createdAt: z.iso.datetime(),
  })
  .strict()

export type CommandPayload = z.infer<typeof commandPayloadSchema>

export const commandAckPayloadSchema = z
  .object({
    commandId: z.string().min(1),
    zoneId: z.string().min(1),
    status: z.enum(['acknowledged', 'failed']),
    acknowledgedAt: z.iso.datetime(),
    message: z.string().optional(),
  })
  .strict()

export type CommandAckPayload = z.infer<typeof commandAckPayloadSchema>
