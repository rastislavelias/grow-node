import { db } from '@grow-node/db'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { validateOrReply } from '../utils/validate.js'

const zoneParamsSchema = z.object({
  zoneId: z.string().min(1),
})

export async function registerZoneRoutes(app: FastifyInstance) {
  app.get('/zones', async () => {
    const zones = await db.zone.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        state: true,
        devices: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        telemetryReadings: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1,
        },
      },
    })

    return {
      zones: zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        state: zone.state,
        devices: zone.devices,
        latestTelemetry: zone.telemetryReadings[0] ?? null,
      })),
    }
  })

  app.get('/zones/:zoneId', async (request, reply) => {
    const params = validateOrReply(zoneParamsSchema, request.params, reply)

    if (!params) {
      return
    }

    const zone = await db.zone.findUnique({
      where: {
        id: params.zoneId,
      },
      include: {
        plantProfile: true,
        state: true,
        devices: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!zone) {
      reply.status(404).send({
        error: 'Zone not found',
      })
      return
    }

    return {
      zone,
    }
  })
}
