/**
 * Database Configuration
 * 
 * Centralized database settings for development.
 * Modify these values as needed for your local setup.
 */

export const dbConfig = {
  // Connection settings
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'mrkrabs',
  
  // Authentication
  // For local development, you can use:
  // - Peer authentication (no user/password): leave user/password empty or use postgresql:///database_name
  // - Password authentication: provide username and password
  user: process.env.DB_USER || '', // Empty string uses peer authentication (your system user)
  password: process.env.DB_PASSWORD || '',
  
  // Connection options
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
  
  // Connection string (auto-generated if not provided)
  // If DATABASE_URL is set, it takes precedence over individual settings above
  connectionString: process.env.DATABASE_URL || '',
}

/**
 * Get the database connection URL
 * Uses DATABASE_URL if set, otherwise constructs from individual settings
 */
export function getDatabaseUrl(): string {
  if (dbConfig.connectionString) {
    return dbConfig.connectionString
  }
  
  // Construct connection string from individual settings
  if (dbConfig.user && dbConfig.password) {
    // Password authentication
    return `postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
  } else if (dbConfig.user) {
    // Username only (peer auth with specific user)
    return `postgresql://${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
  } else {
    // Peer authentication (Unix socket, no credentials)
    return `postgresql:///${dbConfig.database}`
  }
}
