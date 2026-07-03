import { z } from 'zod'

const envSchema = z.object({
  MQTT_URL: z.url().default('mqtt://localhost:1883'),
  CONTROL_HOST: z.string().default('0.0.0.0'),
  CONTROL_PORT: z.coerce.number().int().positive().default(4100),
})

export const env = envSchema.parse(process.env)
