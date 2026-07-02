import 'dotenv/config'
import { defineConfig } from 'prisma/config'

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://grow_node:grow_node@localhost:5432/grow_node'

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
})
