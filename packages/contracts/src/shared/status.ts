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

export const zoneStatusSchema = z.enum(['normal', 'warning', 'critical'])
export type ZoneStatus = z.infer<typeof zoneStatusSchema>
