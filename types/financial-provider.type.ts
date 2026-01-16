export type AccountType = 'credit_card' | 'checking' | 'savings' | 'investment'

export interface FinancialProvider {
  providerID: string
  name: string
  slug: string
  logoUrl?: string | null
  supportedAccountTypes: AccountType[]
  created: Date
  lastUpdated: Date
}

export interface CreateFinancialProviderInput {
  name: string
  slug: string
  logoUrl?: string
  supportedAccountTypes: AccountType[]
}
