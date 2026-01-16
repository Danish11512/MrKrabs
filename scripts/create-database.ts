#!/usr/bin/env bun

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import postgres from 'postgres'
import { getDatabaseUrl, dbConfig } from '../lib/db/config'

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

const databaseUrl = getDatabaseUrl()
const dbName = dbConfig.database

if (!databaseUrl) {
  console.error('❌ Error: Database connection string is not configured')
  process.exit(1)
}

console.log(`🔍 Checking if database '${dbName}' exists...`)

try {
  // Try to connect to the postgres database to check if our target database exists
  // Parse the connection string to connect to 'postgres' database instead
  let adminUrl: string
  
  if (databaseUrl.includes(`/${dbName}`)) {
    // Replace the database name with 'postgres' for admin connection
    adminUrl = databaseUrl.replace(`/${dbName}`, '/postgres')
  } else if (databaseUrl.endsWith(`/${dbName}`)) {
    adminUrl = databaseUrl.replace(`/${dbName}`, '/postgres')
  } else {
    // For peer auth format (postgresql:///database), we need to construct admin URL
    if (databaseUrl.startsWith('postgresql:///')) {
      adminUrl = 'postgresql:///postgres'
    } else {
      // Try to extract connection parts and use postgres database
      const url = new URL(databaseUrl.replace('postgresql://', 'http://'))
      adminUrl = `postgresql://${url.username ? `${url.username}:${url.password}@` : ''}${url.hostname}:${url.port || 5432}/postgres`
    }
  }
  
  const adminClient = postgres(adminUrl, { max: 1 })
  
  // Check if database exists
  const result = await adminClient`
    SELECT 1 FROM pg_database WHERE datname = ${dbName}
  `
  
  if (result.length === 0) {
    console.log(`📦 Creating database '${dbName}'...`)
    await adminClient.unsafe(`CREATE DATABASE ${dbName}`)
    console.log(`✅ Database '${dbName}' created successfully`)
  } else {
    console.log(`✅ Database '${dbName}' already exists`)
  }
  
  await adminClient.end()
  process.exit(0)
} catch (error) {
  console.error('❌ Failed to create database:', error instanceof Error ? error.message : String(error))
  
  // Provide helpful instructions
  if (error instanceof Error && error.message.includes('does not exist')) {
    console.log('')
    console.log('💡 Tip: You may need to create the database manually:')
    console.log(`   createdb ${dbName}`)
    console.log('')
    console.log('Or connect to PostgreSQL and run:')
    console.log(`   CREATE DATABASE ${dbName};`)
  }
  
  process.exit(1)
}
