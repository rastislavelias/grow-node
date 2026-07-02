import type { FastifyInstance } from 'fastify'

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get('/health', () => {
    return {
      status: 'ok',
    }
  })
}
