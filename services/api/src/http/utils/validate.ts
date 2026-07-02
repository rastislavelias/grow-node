import type { FastifyReply } from 'fastify'
import { z } from 'zod'

export function validateOrReply<T>(
  schema: z.ZodType<T>,
  value: unknown,
  reply: FastifyReply,
): T | null {
  const result = schema.safeParse(value)

  if (!result.success) {
    reply.status(400).send({
      error: 'Validation failed',
      issues: z.treeifyError(result.error),
    })

    return null
  }

  return result.data
}
