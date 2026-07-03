import { z } from 'zod'

export const deviceStatusSchema = z.enum(['online', 'offline'])
export type DeviceStatus = z.infer<typeof deviceStatusSchema>

export const commandStatusSchema = z.enum([
  'pending',
  'published',
  'acknowledged',
  'failed',
])
export type CommandStatus = z.infer<typeof commandStatusSchema>

export const zoneStatusSchema = z.enum(['normal', 'warning', 'danger'])
export type ZoneStatus = z.infer<typeof zoneStatusSchema>

export const zonePhaseSchema = z.enum(['lightOn', 'lightOff'])
export type ZonePhase = z.infer<typeof zonePhaseSchema>
