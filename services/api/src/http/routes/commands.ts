import { db } from '@grow-node/db'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { validateOrReply } from '../utils/validate.js'

const zoneParamsSchema = z.object({
  zoneId: z.string().min(1),
})

const commandsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(25),
})

export async function registerCommandRoutes(app: FastifyInstance) {
  app.get('/zones/:zoneId/commands', async (request, reply) => {
    const params = validateOrReply(zoneParamsSchema, request.params, reply)

    if (!params) {
      return
    }

    const query = validateOrReply(commandsQuerySchema, request.query, reply)

    if (!query) {
      return
    }

    const commands = await db.command.findMany({
      where: {
        zoneId: params.zoneId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: query.limit,
    })

    return {
      commands,
    }
  })
}
