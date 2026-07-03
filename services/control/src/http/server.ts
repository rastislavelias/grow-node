import Fastify from 'fastify'

type ControlHealth = {
  service: 'control'
  status: 'ok' | 'degraded'
  checkedAt: string
  dependencies: {
    mqtt: 'ok' | 'down'
  }
}

type GetControlHealth = () => ControlHealth

export function createHealthServer(getHealth: GetControlHealth) {
  const app = Fastify({
    logger: true,
  })

  app.get('/health', () => {
    return getHealth()
  })

  return app
}
