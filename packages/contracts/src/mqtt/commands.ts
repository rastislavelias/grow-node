import { z } from 'zod'

export const commandTypeSchema = z.enum(['set-output'])
export type CommandType = z.infer<typeof commandTypeSchema>

export const setOutputPayloadSchema = z.object({
  fan: z.boolean(),
  light: z.boolean(),
})

export type SetOutputPayload = z.infer<typeof setOutputPayloadSchema>

export const commandPayloadSchema = z.object({
  commandId: z.string().min(1),
  zoneId: z.string().min(1),
  deviceId: z.string().min(1),
  type: commandTypeSchema,
  payload: setOutputPayloadSchema,
  createdAt: z.iso.datetime(),
})

export type CommandPayload = z.infer<typeof commandPayloadSchema>
