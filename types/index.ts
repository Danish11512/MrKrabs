// Central type definitions
// Domain-specific types will be organized in separate files
// This file serves as the main export point for all types

// Example types (to be expanded as features are added)
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY'

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

// Re-export domain-specific types when they are created
// export * from './transaction'
// export * from './account'
// export * from './budget'
// export * from './common'
