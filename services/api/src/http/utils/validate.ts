import type { FastifyReply } from 'fastify'
import type { ZodSchema } from 'zod'

export function validateOrReply<T>(
  schema: ZodSchema<T>,
  value: unknown,
  reply: FastifyReply,
): T | null {
  const result = schema.safeParse(value)

  if (!result.success) {
    reply.status(400).send({
      error: 'Validation failed',
      issues: result.error.flatten(),
    })

    return null
  }

  return result.data
}
