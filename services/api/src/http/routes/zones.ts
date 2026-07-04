import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { db } from '@grow-node/db'
import { zonesResponseSchema } from '@grow-node/contracts'

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
        telemetryReadings: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1,
        },
      },
    })

    const response = {
      zones: zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        controller: {
          type: zone.controllerType.toLowerCase() as 'esp32' | 'simulator',
          firmwareVersion: zone.controllerFirmwareVersion,
          lastSeenAt: zone.controllerLastSeenAt?.toISOString() ?? null,
        },
        state: zone.state
          ? {
              status: zone.state.status.toLowerCase(),
              activePhase:
                zone.state.activePhase === 'LIGHT_ON' ? 'lightOn' : 'lightOff',
              fanDesired: zone.state.fanDesired,
              lightDesired: zone.state.lightDesired,
              heaterDesired: zone.state.heaterDesired,
              reasons: Array.isArray(zone.state.reasons)
                ? zone.state.reasons
                : [],
              lastTelemetryAt:
                zone.state.lastTelemetryAt?.toISOString() ?? null,
              lastEvaluatedAt:
                zone.state.lastEvaluatedAt?.toISOString() ?? null,
            }
          : null,
        latestTelemetry: zone.telemetryReadings[0]
          ? {
              temperatureC: zone.telemetryReadings[0].temperatureC,
              humidityPct: zone.telemetryReadings[0].humidityPct,
              lightLux: zone.telemetryReadings[0].lightLux,
              estimatedPpfd: zone.telemetryReadings[0].estimatedPpfd,
              vpdKpa: zone.telemetryReadings[0].vpdKpa,
              condensationMarginC:
                zone.telemetryReadings[0].condensationMarginC,
              recordedAt: zone.telemetryReadings[0].recordedAt.toISOString(),
            }
          : null,
      })),
    }

    return zonesResponseSchema.parse(response)
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
