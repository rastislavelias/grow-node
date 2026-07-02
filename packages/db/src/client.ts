import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from './generated/prisma/client.js'

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://grow_node:grow_node@localhost:5432/grow_node'

const adapter = new PrismaPg({ connectionString })

export const db = new PrismaClient({ adapter })
