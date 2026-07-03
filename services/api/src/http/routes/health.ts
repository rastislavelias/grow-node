import { systemHealthResponseSchema } from '@grow-node/contracts'
import { db } from '@grow-node/db'
import type { FastifyInstance } from 'fastify'

import { env } from '../../config/env.js'
import { isMqttPublisherConnected } from '../../mqtt/publisher.js'

type DependencyStatus = 'ok' | 'down'

async function checkDatabase(): Promise<DependencyStatus> {
  try {
    await db.$queryRaw`SELECT 1`
    return 'ok'
  } catch {
    return 'down'
  }
}

async function checkControlService(): Promise<DependencyStatus> {
  try {
    const response = await fetch(env.CONTROL_HEALTH_URL, {
      signal: AbortSignal.timeout(1000),
    })

    return response.ok ? 'ok' : 'down'
  } catch {
    return 'down'
  }
}

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    const database = await checkDatabase()
    const control = await checkControlService()
    const mqtt: DependencyStatus = isMqttPublisherConnected() ? 'ok' : 'down'

    const heartbeatCutoff = new Date(Date.now() - env.HEARTBEAT_STALE_MS)

    const [totalDevices, recentlySeenDevices, latestHeartbeat] =
      await Promise.all([
        db.device.count(),
        db.device.count({
          where: {
            lastSeenAt: {
              gte: heartbeatCutoff,
            },
          },
        }),
        db.deviceHeartbeat.findFirst({
          orderBy: {
            seenAt: 'desc',
          },
        }),
      ])

    const allDependenciesOk =
      database === 'ok' && mqtt === 'ok' && control === 'ok'

    const allDevicesRecentlySeen =
      totalDevices > 0 && recentlySeenDevices === totalDevices

    const response = {
      service: 'api',
      status: allDependenciesOk && allDevicesRecentlySeen ? 'ok' : 'degraded',
      checkedAt: new Date().toISOString(),
      dependencies: {
        database,
        mqtt,
        control,
      },
      devices: {
        total: totalDevices,
        recentlySeen: recentlySeenDevices,
        lastHeartbeatAt: latestHeartbeat?.seenAt.toISOString() ?? null,
        staleAfterMs: env.HEARTBEAT_STALE_MS,
      },
    }

    return systemHealthResponseSchema.parse(response)
  })
}
