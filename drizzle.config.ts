import { defineConfig } from 'drizzle-kit'
import { getDatabaseUrl } from './lib/db/config'

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
})
