import { z } from 'zod'

const envSchema = z.object({
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  DASHBOARD_ORIGIN: z.url().default('http://localhost:3000'),
})

export const env = envSchema.parse(process.env)
