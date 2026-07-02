import { db } from '@grow-node/db'

import { env } from './config/env.js'
import { createServer } from './http/server.js'

const app = createServer()

try {
  await app.listen({
    host: env.API_HOST,
    port: env.API_PORT,
  })
} catch (error: unknown) {
  app.log.error(error)
  await db.$disconnect()
  process.exit(1)
}

async function shutdown() {
  await app.close()
  await db.$disconnect()
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdown()
})

process.on('SIGTERM', () => {
  void shutdown()
})
