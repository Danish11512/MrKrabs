import type { AccountType } from './financial-provider.type'

export interface FinancialAccount {
  accountID: string
  connectionID: string
  providerAccountID: string
  accountNumber?: string | null
  accountType: AccountType
  accountSubtype?: string | null
  balance: string // Decimal as string for precision
  currency: string
  creditLimit?: string | null // Decimal as string
  statementDate?: Date | null
  dueDate?: Date | null
  name?: string | null
  created: Date
  lastUpdated: Date
}

export interface FinancialAccountWithConnection extends FinancialAccount {
  connection: {
    connectionID: string
    provider: {
      name: string
      slug: string
    }
  }
}

export interface AccountSummary {
  totalBalance: string
  totalCreditLimit?: string | null
  accountCount: number
  byType: Record<AccountType, number>
}
