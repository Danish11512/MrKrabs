import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { getDatabaseUrl, dbConfig } from './config'

const connectionString = getDatabaseUrl()

if (!connectionString) {
  throw new Error('Database connection string is not configured. Please check lib/db/config.ts or set DATABASE_URL environment variable.')
}

const client = postgres(connectionString, {
  max: dbConfig.max,
  ssl: dbConfig.ssl,
})

export const db = drizzle(client, { schema })
export { dbConfig, getDatabaseUrl }
