export type ConnectionStatus = 'authorizing' | 'connected' | 'disconnected' | 'error' | 'expired'

export interface ProviderConnection {
  connectionID: string
  userID: string
  providerID: string
  accessToken: string // Encrypted in DB, decrypted when retrieved
  status: ConnectionStatus
  lastSyncedAt?: Date | null
  errorMessage?: string | null
  created: Date
  lastUpdated: Date
}

export interface ProviderConnectionWithProvider extends ProviderConnection {
  provider: {
    providerID: string
    name: string
    slug: string
    logoUrl?: string | null
  }
}

export interface CreateConnectionInput {
  providerID: string
}

export interface AuthorizeConnectionInput {
  connectionID: string
}

export interface SyncConnectionResult {
  syncedAt: Date
  accountsUpdated: number
  transactionsAdded: number
}
