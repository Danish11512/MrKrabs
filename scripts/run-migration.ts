#!/usr/bin/env bun

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import postgres from 'postgres'

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
  process.exit(1)
}

const migrationPath = resolve(process.cwd(), 'lib/db/migrations/0001_amused_infant_terrible.sql')
const migrationSQL = readFileSync(migrationPath, 'utf-8')

console.log('🔄 Running migration...')

const sql = postgres(databaseUrl)

try {
  // Split migration by statement-breakpoint comments
  const statements = migrationSQL
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    if (statement.trim()) {
      console.log(`Executing: ${statement.substring(0, 50)}...`)
      await sql.unsafe(statement)
    }
  }

  console.log('✅ Migration completed successfully')
  await sql.end()
} catch (error) {
  console.error('❌ Migration failed:', error)
  await sql.end()
  process.exit(1)
}
