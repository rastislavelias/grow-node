import { z } from 'zod'

const envSchema = z.object({
  MQTT_URL: z.url().default('mqtt://localhost:1883'),
  SIMULATOR_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
})

export const env = envSchema.parse(process.env)
