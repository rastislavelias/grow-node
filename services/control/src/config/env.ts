import { z } from 'zod'

const envSchema = z.object({
  MQTT_URL: z.url().default('mqtt://localhost:1883'),
})

export const env = envSchema.parse(process.env)
