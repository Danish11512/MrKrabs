import { faker } from '@faker-js/faker'
import type { AccountType, FinancialProvider } from '@/types'
import type { FinancialAccount } from '@/types'
import type { FinancialTransaction, TransactionType } from '@/types'

// Seed for consistent data during development
faker.seed(42)

const TRANSACTION_CATEGORIES = [
  'Shopping',
  'Food & Dining',
  'Travel',
  'Gas & Fuel',
  'Entertainment',
  'Bills & Utilities',
  'Groceries',
  'Healthcare',
  'Education',
  'Transportation',
  'Personal Care',
  'Home & Garden',
  'Insurance',
  'Banking',
  'Other',
]

const ACCOUNT_SUBTYPES: Record<AccountType, string[]> = {
  credit_card: ['rewards', 'cashback', 'travel', 'business', 'platinum', 'gold', 'student'],
  checking: ['personal', 'business', 'joint', 'student'],
  savings: ['personal', 'business', 'high_yield', 'money_market'],
  investment: ['brokerage', 'ira', '401k', 'roth_ira'],
}

/**
 * Generates a fake access token for OAuth simulation
 */
export function generateAccessToken(): string {
  return `fake_token_${faker.string.alphanumeric(32)}`
}

/**
 * Generates account number in masked format (****1234)
 */
export function generateAccountNumber(): string {
  const lastFour = faker.string.numeric(4)
  return `****${lastFour}`
}

/**
 * Generates 1-3 accounts for a connection
 */
export function generateAccounts(
  connectionID: string,
  providerAccountTypes: AccountType[],
  count: number = faker.number.int({ min: 1, max: 3 }),
): Omit<FinancialAccount, 'accountID' | 'created' | 'lastUpdated'>[] {
  const accounts: Omit<FinancialAccount, 'accountID' | 'created' | 'lastUpdated'>[] = []

  for (let i = 0; i < count; i++) {
    const accountType = faker.helpers.arrayElement(providerAccountTypes)
    const subtype = faker.helpers.arrayElement(ACCOUNT_SUBTYPES[accountType] || [''])

    // Generate balance based on account type
    let balance: string
    let creditLimit: string | null = null
    let statementDate: Date | null = null
    let dueDate: Date | null = null

    if (accountType === 'credit_card') {
      // Credit cards: negative balance (debt), positive limit
      creditLimit = faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 }).toString()
      const utilization = faker.number.float({ min: 0.1, max: 0.9 }) // 10-90% utilization
      balance = (-parseFloat(creditLimit) * utilization).toFixed(2)

      // Statement and due dates
      const today = new Date()
      statementDate = faker.date.between({
        from: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        to: new Date(today.getFullYear(), today.getMonth(), 0),
      })
      dueDate = faker.date.future({ years: 0.1, refDate: statementDate })
    } else if (accountType === 'checking') {
      balance = faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }).toString()
    } else if (accountType === 'savings') {
      balance = faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 }).toString()
    } else {
      // investment
      balance = faker.number.float({ min: 5000, max: 500000, fractionDigits: 2 }).toString()
    }

    accounts.push({
      connectionID,
      providerAccountID: faker.string.uuid(),
      accountNumber: generateAccountNumber(),
      accountType,
      accountSubtype: subtype || null,
      balance,
      currency: 'USD',
      creditLimit,
      statementDate,
      dueDate,
      name: `${faker.company.name()} ${accountType === 'credit_card' ? 'Card' : 'Account'}`,
    })
  }

  return accounts
}

/**
 * Generates transaction history for an account (3-6 months)
 */
export function generateTransactions(
  accountID: string,
  accountType: AccountType,
  months: number = faker.number.int({ min: 3, max: 6 }),
): Omit<FinancialTransaction, 'transactionID' | 'created' | 'lastUpdated'>[] {
  const transactions: Omit<FinancialTransaction, 'transactionID' | 'created' | 'lastUpdated'>[] = []
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1)

  // Generate 20-100 transactions per month
  const transactionsPerMonth = faker.number.int({ min: 20, max: 100 })
  const totalTransactions = transactionsPerMonth * months

  for (let i = 0; i < totalTransactions; i++) {
    const transactionDate = faker.date.between({ from: startDate, to: now })
    const postedDate = faker.date.between({
      from: transactionDate,
      to: new Date(transactionDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 0-3 days later
    })

    const category = faker.helpers.arrayElement(TRANSACTION_CATEGORIES)
    const merchant = faker.company.name()
    const description = `${merchant} - ${faker.commerce.productName()}`

    // Determine transaction type and amount based on account type
    let type: TransactionType
    let amount: string

    if (accountType === 'credit_card') {
      // Credit cards: purchases are debits (negative), payments are credits (positive)
      if (faker.datatype.boolean(0.9)) {
        // 90% purchases (debits)
        type = 'debit'
        amount = (-faker.number.float({ min: 5, max: 500, fractionDigits: 2 })).toFixed(2)
      } else {
        // 10% payments (credits)
        type = 'credit'
        amount = faker.number.float({ min: 100, max: 2000, fractionDigits: 2 }).toFixed(2)
      }
    } else {
      // Checking/savings: debits are withdrawals, credits are deposits
      if (faker.datatype.boolean(0.7)) {
        // 70% debits (spending)
        type = 'debit'
        amount = (-faker.number.float({ min: 10, max: 1000, fractionDigits: 2 })).toFixed(2)
      } else {
        // 30% credits (deposits)
        type = 'credit'
        amount = faker.number.float({ min: 500, max: 5000, fractionDigits: 2 }).toFixed(2)
      }
    }

    const status = faker.helpers.arrayElement(['posted', 'posted', 'posted', 'pending'] as const) // 75% posted

    transactions.push({
      accountID,
      providerTransactionID: faker.string.uuid(),
      amount,
      type,
      currency: 'USD',
      description,
      merchant,
      category,
      status,
      transactionDate,
      postedDate: status === 'posted' ? postedDate : null,
      locationCity: faker.location.city(),
      locationState: faker.location.state({ abbreviated: true }),
      locationCountry: 'US',
    })
  }

  // Sort by transaction date (oldest first)
  transactions.sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime())

  return transactions
}

/**
 * Generates a balance value directly (as real APIs provide)
 * This simulates the balance provided by the financial provider
 */
export function generateBalance(accountType: AccountType, existingBalance?: string): string {
  if (existingBalance) {
    // For incremental sync, balance might change slightly
    const current = parseFloat(existingBalance)
    const change = faker.number.float({ min: -0.05, max: 0.05 }) // ±5% variation
    return (current * (1 + change)).toFixed(2)
  }

  // Generate new balance
  if (accountType === 'credit_card') {
    return (-faker.number.float({ min: 100, max: 5000, fractionDigits: 2 })).toFixed(2)
  } else if (accountType === 'checking') {
    return faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }).toFixed(2)
  } else if (accountType === 'savings') {
    return faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 }).toFixed(2)
  } else {
    return faker.number.float({ min: 5000, max: 500000, fractionDigits: 2 }).toFixed(2)
  }
}
