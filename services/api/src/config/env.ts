import { z } from 'zod'

const envSchema = z.object({
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  DASHBOARD_ORIGIN: z.url().default('http://localhost:3000'),
  MQTT_URL: z.url().default('mqtt://localhost:1883'),
  CONTROL_HEALTH_URL: z.url().default('http://control:4100/health'),
  HEARTBEAT_STALE_MS: z.coerce.number().int().positive().default(30000),
})

export const env = envSchema.parse(process.env)
