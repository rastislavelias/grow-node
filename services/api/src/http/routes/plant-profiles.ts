import {
  assignPlantProfileRequestSchema,
  createPlantProfileRequestSchema,
  phaseConfigSchema,
  plantProfileInUseResponseSchema,
  plantProfileResponseSchema,
  plantProfileSchema,
  plantProfilesResponseSchema,
  updatePlantProfileRequestSchema,
  zonePlantProfileAssignmentResponseSchema,
} from '@grow-node/contracts'
import { db } from '@grow-node/db'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { validateOrReply } from '../utils/validate.js'

const plantProfileParamsSchema = z.object({
  plantProfileId: z.string().min(1),
})

const zoneParamsSchema = z.object({
  zoneId: z.string().min(1),
})

const plantProfileInclude = {
  zones: {
    orderBy: {
      name: 'asc' as const,
    },
    select: {
      id: true,
      name: true,
    },
  },
}

function mapPlantProfile(profile: {
  id: string
  name: string
  scheduleStartMinutes: number
  scheduleDurationMinutes: number
  phaseConfig: unknown
  zones: Array<{ id: string; name: string }>
  createdAt: Date
  updatedAt: Date
}) {
  return plantProfileSchema.parse({
    id: profile.id,
    name: profile.name,
    scheduleStartMinutes: profile.scheduleStartMinutes,
    scheduleDurationMinutes: profile.scheduleDurationMinutes,
    phaseConfig: phaseConfigSchema.parse(profile.phaseConfig),
    zones: profile.zones,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  })
}

export async function registerPlantProfileRoutes(app: FastifyInstance) {
  app.get('/plant-profiles', async () => {
    const plantProfiles = await db.plantProfile.findMany({
      orderBy: {
        name: 'asc',
      },
      include: plantProfileInclude,
    })

    return plantProfilesResponseSchema.parse({
      plantProfiles: plantProfiles.map(mapPlantProfile),
    })
  })

  app.get('/plant-profiles/:plantProfileId', async (request, reply) => {
    const params = validateOrReply(
      plantProfileParamsSchema,
      request.params,
      reply,
    )

    if (!params) {
      return
    }

    const plantProfile = await db.plantProfile.findUnique({
      where: {
        id: params.plantProfileId,
      },
      include: plantProfileInclude,
    })

    if (!plantProfile) {
      reply.status(404).send({
        error: 'Plant profile not found',
      })
      return
    }

    return plantProfileResponseSchema.parse({
      plantProfile: mapPlantProfile(plantProfile),
    })
  })

  app.post('/plant-profiles', async (request, reply) => {
    const body = validateOrReply(
      createPlantProfileRequestSchema,
      request.body,
      reply,
    )

    if (!body) {
      return
    }

    const existingPlantProfile = await db.plantProfile.findUnique({
      where: {
        name: body.name,
      },
      select: {
        id: true,
      },
    })

    if (existingPlantProfile) {
      reply.status(409).send({
        error: 'Plant profile name already exists',
        code: 'PLANT_PROFILE_NAME_CONFLICT',
      })
      return
    }

    const plantProfile = await db.plantProfile.create({
      data: body,
      include: plantProfileInclude,
    })

    reply.status(201)
    return plantProfileResponseSchema.parse({
      plantProfile: mapPlantProfile(plantProfile),
    })
  })

  app.put('/plant-profiles/:plantProfileId', async (request, reply) => {
    const params = validateOrReply(
      plantProfileParamsSchema,
      request.params,
      reply,
    )

    if (!params) {
      return
    }

    const body = validateOrReply(
      updatePlantProfileRequestSchema,
      request.body,
      reply,
    )

    if (!body) {
      return
    }

    const [plantProfile, nameConflict] = await Promise.all([
      db.plantProfile.findUnique({
        where: {
          id: params.plantProfileId,
        },
        select: {
          id: true,
        },
      }),
      db.plantProfile.findFirst({
        where: {
          name: body.name,
          NOT: {
            id: params.plantProfileId,
          },
        },
        select: {
          id: true,
        },
      }),
    ])

    if (!plantProfile) {
      reply.status(404).send({
        error: 'Plant profile not found',
      })
      return
    }

    if (nameConflict) {
      reply.status(409).send({
        error: 'Plant profile name already exists',
        code: 'PLANT_PROFILE_NAME_CONFLICT',
      })
      return
    }

    const updatedPlantProfile = await db.plantProfile.update({
      where: {
        id: params.plantProfileId,
      },
      data: body,
      include: plantProfileInclude,
    })

    return plantProfileResponseSchema.parse({
      plantProfile: mapPlantProfile(updatedPlantProfile),
    })
  })

  app.delete('/plant-profiles/:plantProfileId', async (request, reply) => {
    const params = validateOrReply(
      plantProfileParamsSchema,
      request.params,
      reply,
    )

    if (!params) {
      return
    }

    const plantProfile = await db.plantProfile.findUnique({
      where: {
        id: params.plantProfileId,
      },
      select: {
        id: true,
        zones: {
          orderBy: {
            name: 'asc',
          },
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!plantProfile) {
      reply.status(404).send({
        error: 'Plant profile not found',
      })
      return
    }

    if (plantProfile.zones.length > 0) {
      reply.status(409).send(
        plantProfileInUseResponseSchema.parse({
          error: 'Plant profile is in use',
          code: 'PLANT_PROFILE_IN_USE',
          zones: plantProfile.zones,
        }),
      )
      return
    }

    await db.plantProfile.delete({
      where: {
        id: plantProfile.id,
      },
    })

    reply.status(204).send()
  })

  app.put('/zones/:zoneId/plant-profile', async (request, reply) => {
    const params = validateOrReply(zoneParamsSchema, request.params, reply)

    if (!params) {
      return
    }

    const body = validateOrReply(
      assignPlantProfileRequestSchema,
      request.body,
      reply,
    )

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
        plantProfileId: plantProfile.id,
      },
      select: {
        id: true,
        name: true,
        plantProfileId: true,
      },
    })

    return zonePlantProfileAssignmentResponseSchema.parse({
      zone: updatedZone,
    })
  })
}
