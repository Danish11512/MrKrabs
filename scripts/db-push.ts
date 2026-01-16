#!/usr/bin/env bun

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

declare const Bun: {
  spawn: (args: string[], options: { stdio: string[]; env: NodeJS.ProcessEnv }) => {
    exited: Promise<number>
  }
}

const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return
  
  const envContent = readFileSync(filePath, 'utf-8')
  const lines = envContent.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/)
      if (match) {
        const [, key, value] = match
        const cleanValue = value.trim().replace(/^["']|["']$/g, '')
        if (key && cleanValue) {
          process.env[key] = cleanValue
        }
      }
    }
  }
}

// Load environment variables first
if (existsSync(envLocalPath)) {
  loadEnvFile(envLocalPath)
} else if (existsSync(envPath)) {
  loadEnvFile(envPath)
}

// Import config after loading env vars
const { getDatabaseUrl } = await import('../lib/db/config.js')
const databaseUrl = getDatabaseUrl()

if (!databaseUrl) {
  console.error('❌ Error: Database connection string is not configured')
  console.error('')
  console.error('Please configure database settings in lib/db/config.ts')
  console.error('Or set DATABASE_URL in .env.local')
  process.exit(1)
}

// Set DATABASE_URL for drizzle-kit
process.env.DATABASE_URL = databaseUrl

// Ensure database exists before syncing schema
console.log('🔍 Ensuring database exists...')
const createDbProc = Bun.spawn(['bun', 'scripts/create-database.ts'], {
  stdio: ['inherit', 'inherit', 'inherit'],
  env: process.env,
})
const createDbExitCode = await createDbProc.exited
if (createDbExitCode !== 0) {
  console.error('⚠️  Database creation check failed, but continuing with schema sync...')
}

console.log('🔄 Syncing database schema...')

try {
  const proc = Bun.spawn(['bunx', 'drizzle-kit', 'push'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    env: process.env,
  })

  const exitCode = await proc.exited

  if (exitCode === 0) {
    console.log('✅ Database schema synced successfully')
  } else {
    console.error('❌ Failed to sync database schema')
    process.exit(exitCode)
  }
} catch (error) {
  console.error('❌ Failed to run drizzle-kit push:', error instanceof Error ? error.message : String(error))
  process.exit(1)
}
