import { db } from '@grow-node/db'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { validateOrReply } from '../utils/validate.js'

const zoneParamsSchema = z.object({
  zoneId: z.string().min(1),
})

const telemetryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(25),
})

export async function registerTelemetryRoutes(app: FastifyInstance) {
  app.get('/zones/:zoneId/telemetry', async (request, reply) => {
    const params = validateOrReply(zoneParamsSchema, request.params, reply)

    if (!params) {
      return
    }

    const query = validateOrReply(telemetryQuerySchema, request.query, reply)

    if (!query) {
      return
    }

    const readings = await db.telemetryReading.findMany({
      where: {
        zoneId: params.zoneId,
      },
      orderBy: {
        recordedAt: 'desc',
      },
      take: query.limit,
    })

    return {
      readings,
    }
  })
}
