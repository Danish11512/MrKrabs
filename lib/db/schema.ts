import { pgTable, uuid, varchar, timestamp, boolean, decimal, text, pgEnum, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  userID: uuid('user_id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  created: timestamp('created').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }),
  validated: boolean('validated').default(false).notNull(),
})

// Enums
export const connectionStatusEnum = pgEnum('connection_status', [
  'authorizing',
  'connected',
  'disconnected',
  'error',
  'expired',
])

export const accountTypeEnum = pgEnum('account_type', [
  'credit_card',
  'checking',
  'savings',
  'investment',
])

export const transactionTypeEnum = pgEnum('transaction_type', [
  'debit',
  'credit',
])

export const transactionStatusEnum = pgEnum('transaction_status', [
  'posted',
  'pending',
  'refunded',
])

// Financial Providers
export const financialProviders = pgTable('financial_providers', {
  providerID: uuid('provider_id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  logoUrl: text('logo_url'),
  supportedAccountTypes: text('supported_account_types').array().notNull(), // Array of account types
  created: timestamp('created').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
})

// Provider Connections
export const providerConnections = pgTable('provider_connections', {
  connectionID: uuid('connection_id').primaryKey().defaultRandom(),
  userID: uuid('user_id').notNull().references(() => users.userID, { onDelete: 'cascade' }),
  providerID: uuid('provider_id').notNull().references(() => financialProviders.providerID, { onDelete: 'restrict' }),
  accessToken: text('access_token').notNull(), // Encrypted
  status: connectionStatusEnum('status').notNull().default('authorizing'),
  lastSyncedAt: timestamp('last_synced_at'),
  errorMessage: text('error_message'),
  created: timestamp('created').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
  userProviderIdx: index('user_provider_idx').on(table.userID, table.providerID),
  statusIdx: index('status_idx').on(table.status),
}))

// Financial Accounts
export const financialAccounts = pgTable('financial_accounts', {
  accountID: uuid('account_id').primaryKey().defaultRandom(),
  connectionID: uuid('connection_id').notNull().references(() => providerConnections.connectionID, { onDelete: 'cascade' }),
  providerAccountID: varchar('provider_account_id', { length: 255 }).notNull(), // External account ID from provider
  accountNumber: varchar('account_number', { length: 50 }), // Masked: ****1234
  accountType: accountTypeEnum('account_type').notNull(),
  accountSubtype: varchar('account_subtype', { length: 100 }), // e.g., rewards, business, platinum
  balance: decimal('balance', { precision: 19, scale: 4 }).notNull().default('0'),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  creditLimit: decimal('credit_limit', { precision: 19, scale: 4 }), // For credit cards
  statementDate: timestamp('statement_date'), // For credit cards
  dueDate: timestamp('due_date'), // For credit cards
  name: varchar('name', { length: 255 }), // Account nickname/name
  created: timestamp('created').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
  connectionIdx: index('connection_idx').on(table.connectionID),
  providerAccountIdx: index('provider_account_idx').on(table.providerAccountID),
}))

// Financial Transactions
export const financialTransactions = pgTable('financial_transactions', {
  transactionID: uuid('transaction_id').primaryKey().defaultRandom(),
  accountID: uuid('account_id').notNull().references(() => financialAccounts.accountID, { onDelete: 'cascade' }),
  providerTransactionID: varchar('provider_transaction_id', { length: 255 }).notNull(), // External transaction ID
  amount: decimal('amount', { precision: 19, scale: 4 }).notNull(),
  type: transactionTypeEnum('type').notNull(), // debit or credit
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  description: text('description'),
  merchant: varchar('merchant', { length: 255 }),
  category: varchar('category', { length: 100 }), // Shopping, Food, Travel, etc.
  status: transactionStatusEnum('status').notNull().default('posted'),
  transactionDate: timestamp('transaction_date').notNull(),
  postedDate: timestamp('posted_date'),
  locationCity: varchar('location_city', { length: 100 }),
  locationState: varchar('location_state', { length: 100 }),
  locationCountry: varchar('location_country', { length: 100 }),
  created: timestamp('created').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
  accountIdx: index('account_idx').on(table.accountID),
  transactionDateIdx: index('transaction_date_idx').on(table.transactionDate),
  providerTransactionIdx: index('provider_transaction_idx').on(table.providerTransactionID),
  categoryIdx: index('category_idx').on(table.category),
}))

// Balance Snapshots (optional, for historical balance tracking)
export const balanceSnapshots = pgTable('balance_snapshots', {
  snapshotID: uuid('snapshot_id').primaryKey().defaultRandom(),
  accountID: uuid('account_id').notNull().references(() => financialAccounts.accountID, { onDelete: 'cascade' }),
  balance: decimal('balance', { precision: 19, scale: 4 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  snapshotDate: timestamp('snapshot_date').notNull().defaultNow(),
  created: timestamp('created').defaultNow().notNull(),
}, (table) => ({
  accountDateIdx: index('account_date_idx').on(table.accountID, table.snapshotDate),
}))

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  connections: many(providerConnections),
}))

export const financialProvidersRelations = relations(financialProviders, ({ many }) => ({
  connections: many(providerConnections),
}))

export const providerConnectionsRelations = relations(providerConnections, ({ one, many }) => ({
  user: one(users, {
    fields: [providerConnections.userID],
    references: [users.userID],
  }),
  provider: one(financialProviders, {
    fields: [providerConnections.providerID],
    references: [financialProviders.providerID],
  }),
  accounts: many(financialAccounts),
}))

export const financialAccountsRelations = relations(financialAccounts, ({ one, many }) => ({
  connection: one(providerConnections, {
    fields: [financialAccounts.connectionID],
    references: [providerConnections.connectionID],
  }),
  transactions: many(financialTransactions),
  balanceSnapshots: many(balanceSnapshots),
}))

export const financialTransactionsRelations = relations(financialTransactions, ({ one }) => ({
  account: one(financialAccounts, {
    fields: [financialTransactions.accountID],
    references: [financialAccounts.accountID],
  }),
}))

export const balanceSnapshotsRelations = relations(balanceSnapshots, ({ one }) => ({
  account: one(financialAccounts, {
    fields: [balanceSnapshots.accountID],
    references: [financialAccounts.accountID],
  }),
}))
