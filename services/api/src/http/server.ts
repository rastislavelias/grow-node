import cors from '@fastify/cors'
import Fastify from 'fastify'

import { env } from '../config/env.js'
import { registerCommandRoutes } from './routes/commands.js'
import { registerHealthRoutes } from './routes/health.js'
import { registerPlantProfileRoutes } from './routes/plant-profiles.js'
import { registerTelemetryRoutes } from './routes/telemetry.js'
import { registerZoneRoutes } from './routes/zones.js'

export function createServer() {
  const app = Fastify({
    logger: true,
  })

  void app.register(cors, {
    origin: env.DASHBOARD_ORIGIN,
  })

  void app.register(registerHealthRoutes)
  void app.register(registerPlantProfileRoutes)
  void app.register(registerZoneRoutes)
  void app.register(registerTelemetryRoutes)
  void app.register(registerCommandRoutes)

  return app
}
