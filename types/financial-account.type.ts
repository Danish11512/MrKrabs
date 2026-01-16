import type { AccountType } from './common.type'

export interface FinancialAccount {
  accountID: string
  userID: string
  accountNumber?: string | null
  accountType: AccountType
  accountSubtype?: string | null
  balance: string // Decimal as string for precision
  currency: string
  creditLimit?: string | null // Decimal as string
  statementDate?: Date | null
  dueDate?: Date | null
  name: string // Required for user-defined account name
  created: Date
  lastUpdated: Date
}

export interface AccountSummary {
  totalBalance: string
  totalCreditLimit?: string | null
  accountCount: number
  byType: Record<AccountType, number>
}
