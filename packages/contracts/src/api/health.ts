import { z } from 'zod'

export const healthDependencyStatusSchema = z.enum(['ok', 'down'])

export const systemHealthResponseSchema = z.object({
  service: z.literal('api'),
  status: z.enum(['ok', 'degraded']),
  checkedAt: z.iso.datetime(),
  dependencies: z.object({
    database: healthDependencyStatusSchema,
    mqtt: healthDependencyStatusSchema,
    control: healthDependencyStatusSchema,
  }),
  controllers: z.object({
    total: z.number().int().nonnegative(),
    recentlySeen: z.number().int().nonnegative(),
    lastHeartbeatAt: z.iso.datetime().nullable(),
    staleAfterMs: z.number().int().positive(),
  }),
})

export type SystemHealthResponse = z.infer<typeof systemHealthResponseSchema>
