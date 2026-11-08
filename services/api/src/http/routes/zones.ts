import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { ControllerType, db, ZonePhase, ZoneStatus } from '@grow-node/db'
import {
  createZoneRequestSchema,
  updateZoneRequestSchema,
  zoneConfigurationResponseSchema,
  zonesResponseSchema,
  zoneResponseSchema,
} from '@grow-node/contracts'

import { validateOrReply } from '../utils/validate.js'
import { createZoneMetricEvaluationView } from '../mappers/zone-metric-evaluation.js'

const zoneParamsSchema = z.object({
  zoneId: z.string().min(1),
})

const zoneConfigurationSelect = {
  id: true,
  name: true,
  controllerType: true,
  controllerFirmwareVersion: true,
  plantProfileId: true,
}

function mapZoneConfiguration(zone: {
  id: string
  name: string
  controllerType: ControllerType
  controllerFirmwareVersion: string | null
  plantProfileId: string
}) {
  return zoneConfigurationResponseSchema.parse({
    zone: {
      id: zone.id,
      name: zone.name,
      controllerType: zone.controllerType.toLowerCase(),
      controllerFirmwareVersion: zone.controllerFirmwareVersion,
      plantProfileId: zone.plantProfileId,
    },
  })
}

function toControllerType(controllerType: 'esp32' | 'simulator') {
  return controllerType === 'esp32'
    ? ControllerType.ESP32
    : ControllerType.SIMULATOR
}

export async function registerZoneRoutes(app: FastifyInstance) {
  app.post('/zones', async (request, reply) => {
    const body = validateOrReply(createZoneRequestSchema, request.body, reply)

    if (!body) {
      return
    }

    const [existingZone, plantProfile] = await Promise.all([
      db.zone.findUnique({
        where: {
          id: body.id,
        },
        select: {
          id: true,
        },
      }),
      db.plantProfile.findUnique({
        where: {
          id: body.plantProfileId,
        },
        select: {
          id: true,
        },
      }),
    ])

    if (existingZone) {
      reply.status(409).send({
        error: 'Zone ID already exists',
        code: 'ZONE_ID_CONFLICT',
      })
      return
    }

    if (!plantProfile) {
      reply.status(404).send({
        error: 'Plant profile not found',
      })
      return
    }

    const zone = await db.zone.create({
      data: {
        id: body.id,
        name: body.name,
        controllerType: toControllerType(body.controllerType),
        controllerFirmwareVersion: body.controllerFirmwareVersion,
        plantProfileId: plantProfile.id,
        state: {
          create: {
            status: ZoneStatus.NORMAL,
            activePhase: ZonePhase.LIGHT_OFF,
            fanDesired: false,
            lightDesired: false,
            heaterDesired: false,
            reasons: [],
          },
        },
      },
      select: zoneConfigurationSelect,
    })

    reply.status(201)
    return mapZoneConfiguration(zone)
  })

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
        telemetryReadings: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!zone) {
      reply.status(404).send({
        error: 'Zone not found',
      })
      return
    }

    const latestTelemetry = zone.telemetryReadings[0] ?? null

    const activePhase =
      zone.state?.activePhase === 'LIGHT_ON' ? 'lightOn' : 'lightOff'

    const response = {
      zone: {
        id: zone.id,
        name: zone.name,
        controller: {
          type: zone.controllerType.toLowerCase() as 'esp32' | 'simulator',
          firmwareVersion: zone.controllerFirmwareVersion,
          lastSeenAt: zone.controllerLastSeenAt?.toISOString() ?? null,
        },
        state: zone.state
          ? {
              status: zone.state.status.toLowerCase() as
                'normal' | 'warning' | 'danger',
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
        plantProfile: {
          id: zone.plantProfile.id,
          name: zone.plantProfile.name,
        },
      },
      metricEvaluation: createZoneMetricEvaluationView({
        activePhase,
        phaseConfigValue: zone.plantProfile.phaseConfig,
        latestTelemetry,
        reasonsValue: zone.state?.reasons ?? [],
      }),
    }

    return zoneResponseSchema.parse(response)
  })

  app.put('/zones/:zoneId', async (request, reply) => {
    const params = validateOrReply(zoneParamsSchema, request.params, reply)

    if (!params) {
      return
    }

    const body = validateOrReply(updateZoneRequestSchema, request.body, reply)

    if (!body) {
      return
    }

    const [zone, plantProfile] = await Promise.all([
      db.zone.findUnique({
        where: {
          id: params.zoneId,
        },
        select: {
          id: true,
        },
      }),
      db.plantProfile.findUnique({
        where: {
          id: body.plantProfileId,
        },
        select: {
          id: true,
        },
      }),
    ])

    if (!zone) {
      reply.status(404).send({
        error: 'Zone not found',
      })
      return
    }

    if (!plantProfile) {
      reply.status(404).send({
        error: 'Plant profile not found',
      })
      return
    }

    const updatedZone = await db.zone.update({
      where: {
        id: zone.id,
      },
      data: {
        name: body.name,
        controllerType: toControllerType(body.controllerType),
        controllerFirmwareVersion: body.controllerFirmwareVersion,
        plantProfileId: plantProfile.id,
      },
      select: zoneConfigurationSelect,
    })

    return mapZoneConfiguration(updatedZone)
  })

  app.delete('/zones/:zoneId', async (request, reply) => {
    const params = validateOrReply(zoneParamsSchema, request.params, reply)

    if (!params) {
      return
    }

    const zone = await db.zone.findUnique({
      where: {
        id: params.zoneId,
      },
      select: {
        id: true,
      },
    })

    if (!zone) {
      reply.status(404).send({
        error: 'Zone not found',
      })
      return
    }

    await db.zone.delete({
      where: {
        id: zone.id,
      },
    })

    reply.status(204).send()
  })
}
