import {
  manualCommandRequestSchema,
  type CommandPayload,
} from '@grow-node/contracts'
import { CommandSource, CommandStatus, CommandType, db } from '@grow-node/db'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { publishCommand } from '../../mqtt/publisher.js'
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

  app.post('/zones/:zoneId/commands', async (request, reply) => {
    const params = validateOrReply(zoneParamsSchema, request.params, reply)

    if (!params) {
      return
    }

    const body = validateOrReply(
      manualCommandRequestSchema,
      request.body,
      reply,
    )

    if (!body) {
      return
    }

    const zone = await db.zone.findUnique({
      where: {
        id: params.zoneId,
      },
      include: {
        devices: {
          take: 1,
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

    const device = zone.devices[0]

    if (!device) {
      reply.status(404).send({
        error: 'No device found for zone',
      })
      return
    }

    const command = await db.command.create({
      data: {
        zoneId: zone.id,
        deviceId: device.id,
        source: CommandSource.MANUAL,
        type: CommandType.SET_OUTPUT,
        status: CommandStatus.PENDING,
        payload: body,
      },
    })

    const mqttCommand: CommandPayload = {
      commandId: command.id,
      zoneId: zone.id,
      deviceId: device.id,
      type: 'set-output',
      payload: body,
      createdAt: command.createdAt.toISOString(),
    }

    try {
      await publishCommand(mqttCommand)

      const publishedCommand = await db.command.update({
        where: {
          id: command.id,
        },
        data: {
          status: CommandStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      })

      reply.status(201).send({
        command: publishedCommand,
      })
    } catch (error: unknown) {
      await db.command.update({
        where: {
          id: command.id,
        },
        data: {
          status: CommandStatus.FAILED,
        },
      })

      request.log.error(error)

      reply.status(500).send({
        error: 'Failed to publish command',
      })
    }
  })
}
