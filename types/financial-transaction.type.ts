export type TransactionType = 'debit' | 'credit'
export type TransactionStatus = 'posted' | 'pending' | 'refunded'

export interface FinancialTransaction {
  transactionID: string
  accountID: string
  amount: string // Decimal as string for precision
  type: TransactionType
  currency: string
  description?: string | null
  merchant?: string | null
  category?: string | null
  status: TransactionStatus
  transactionDate: Date
  postedDate?: Date | null
  locationCity?: string | null
  locationState?: string | null
  locationCountry?: string | null
  created: Date
  lastUpdated: Date
}

export interface FinancialTransactionWithAccount extends FinancialTransaction {
  account: {
    accountID: string
    accountNumber?: string | null
    accountType: string
    name?: string | null
  }
}

export interface TransactionFilters {
  accountId?: string
  userId?: string
  startDate?: Date
  endDate?: Date
  category?: string
  status?: TransactionStatus
  type?: TransactionType
}

export interface TransactionPagination {
  cursor?: string
  limit?: number
  sortBy?: 'date' | 'amount'
  sortOrder?: 'asc' | 'desc'
}

export interface TransactionListResponse {
  transactions: FinancialTransactionWithAccount[]
  pagination: {
    cursor?: string
    hasMore: boolean
    total?: number
  }
}
