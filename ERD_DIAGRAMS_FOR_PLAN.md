# Financial APIs Integration - ERD Documentation

## Overview

This document describes the Entity Relationship Diagram (ERD) for the financial APIs integration system. The system allows users to connect to multiple financial providers, sync account data, and view transaction history.

## Entity Relationship Diagram

```
┌─────────────┐
│    users    │
│─────────────│
│ user_id (PK)│
│ first_name  │
│ last_name   │
│ email       │
│ password    │
│ ...         │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────────────────────────┐
│   provider_connections          │
│─────────────────────────────────│
│ connection_id (PK)              │
│ user_id (FK) ──────────────────┼──┐
│ provider_id (FK) ──────────────┼──┼──┐
│ access_token (encrypted)        │  │  │
│ status (enum)                   │  │  │
│ last_synced_at                  │  │  │
│ error_message                   │  │  │
│ created                         │  │  │
│ last_updated                    │  │  │
└──────┬──────────────────────────┘  │  │
       │                             │  │
       │ 1:N                         │  │
       │                             │  │
┌──────▼──────────────────────────┐  │  │
│   financial_accounts             │  │  │
│─────────────────────────────────│  │  │
│ account_id (PK)                   │  │  │
│ connection_id (FK) ──────────────┼──┘  │
│ provider_account_id              │      │
│ account_number                   │      │
│ account_type (enum)              │      │
│ account_subtype                  │      │
│ balance (decimal)                │      │
│ currency                         │      │
│ credit_limit (decimal)           │      │
│ statement_date                   │      │
│ due_date                         │      │
│ name                             │      │
│ created                          │      │
│ last_updated                     │      │
└──────┬──────────────────────────┘      │
       │                                   │
       │ 1:N                               │
       │                                   │
┌──────▼──────────────────────────┐        │
│  financial_transactions         │        │
│─────────────────────────────────│        │
│ transaction_id (PK)             │        │
│ account_id (FK) ────────────────┼────────┘
│ provider_transaction_id         │
│ amount (decimal)                │
│ type (enum: debit/credit)       │
│ currency                         │
│ description                      │
│ merchant                         │
│ category                         │
│ status (enum)                    │
│ transaction_date                 │
│ posted_date                      │
│ location_city                    │
│ location_state                   │
│ location_country                 │
│ created                          │
│ last_updated                     │
└──────────────────────────────────┘

┌──────────────────────────────┐
│   financial_providers       │
│──────────────────────────────│
│ provider_id (PK)             │
│ name                         │
│ slug (unique)                │
│ logo_url                     │
│ supported_account_types      │
│ created                      │
│ last_updated                 │
└──────┬───────────────────────┘
       │
       │ 1:N
       │
       │ (referenced by provider_connections)

┌──────────────────────────────┐
│   balance_snapshots          │
│──────────────────────────────│
│ snapshot_id (PK)             │
│ account_id (FK) ─────────────┼──┐
│ balance (decimal)            │  │
│ currency                      │  │
│ snapshot_date                 │  │
│ created                       │  │
└───────────────────────────────┘  │
                                   │
                                   │ (optional, for historical tracking)
```

## Entity Descriptions

### users
**Primary Key**: `user_id` (UUID)

Existing user table. Users can have multiple provider connections.

**Relationships**:
- One-to-Many with `provider_connections`

### financial_providers
**Primary Key**: `provider_id` (UUID)

Stores available financial institutions (American Express, Chase, etc.).

**Fields**:
- `provider_id`: UUID primary key
- `name`: Provider name (e.g., "American Express")
- `slug`: URL-friendly identifier (unique, e.g., "amex")
- `logo_url`: Optional logo URL
- `supported_account_types`: Array of account types (credit_card, checking, savings, investment)
- `created`: Timestamp
- `last_updated`: Timestamp

**Relationships**:
- One-to-Many with `provider_connections`

### provider_connections
**Primary Key**: `connection_id` (UUID)

Tracks user connections to financial providers with authentication tokens.

**Fields**:
- `connection_id`: UUID primary key
- `user_id`: Foreign key to `users.user_id` (CASCADE DELETE)
- `provider_id`: Foreign key to `financial_providers.provider_id` (RESTRICT DELETE)
- `access_token`: Encrypted access token (encrypted using AES-256-GCM)
- `status`: Enum (authorizing, connected, disconnected, error, expired)
- `last_synced_at`: Timestamp of last successful sync
- `error_message`: Error message if status is 'error'
- `created`: Timestamp
- `last_updated`: Timestamp

**Indexes**:
- `(user_id, provider_id)`: Composite index for quick lookup
- `status`: Index for filtering by status

**Relationships**:
- Many-to-One with `users`
- Many-to-One with `financial_providers`
- One-to-Many with `financial_accounts`

**Constraints**:
- Unique constraint on `(user_id, provider_id)` to prevent duplicate connections

### financial_accounts
**Primary Key**: `account_id` (UUID)

Stores accounts from connected providers.

**Fields**:
- `account_id`: UUID primary key
- `connection_id`: Foreign key to `provider_connections.connection_id` (CASCADE DELETE)
- `provider_account_id`: External account ID from provider (for deduplication)
- `account_number`: Masked account number (e.g., "****1234")
- `account_type`: Enum (credit_card, checking, savings, investment)
- `account_subtype`: Optional subtype (e.g., "rewards", "business", "platinum")
- `balance`: Decimal (19,4) - Balance as provided by provider (authoritative)
- `currency`: ISO currency code (default: USD)
- `credit_limit`: Decimal (19,4) - For credit cards only
- `statement_date`: Timestamp - For credit cards only
- `due_date`: Timestamp - For credit cards only
- `name`: Account nickname/name
- `created`: Timestamp
- `last_updated`: Timestamp

**Indexes**:
- `connection_id`: Index for filtering by connection
- `provider_account_id`: Index for deduplication checks

**Relationships**:
- Many-to-One with `provider_connections`
- One-to-Many with `financial_transactions`
- One-to-Many with `balance_snapshots` (optional)

**Constraints**:
- Unique constraint on `(connection_id, provider_account_id)` to prevent duplicate accounts

### financial_transactions
**Primary Key**: `transaction_id` (UUID)

Stores transaction history from accounts.

**Fields**:
- `transaction_id`: UUID primary key
- `account_id`: Foreign key to `financial_accounts.account_id` (CASCADE DELETE)
- `provider_transaction_id`: External transaction ID from provider (for deduplication)
- `amount`: Decimal (19,4) - Transaction amount
- `type`: Enum (debit, credit) - Critical for proper display
- `currency`: ISO currency code (default: USD)
- `description`: Transaction description
- `merchant`: Merchant name
- `category`: Transaction category (Shopping, Food, Travel, etc.)
- `status`: Enum (posted, pending, refunded)
- `transaction_date`: Timestamp - When transaction occurred
- `posted_date`: Timestamp - When transaction was posted (null if pending)
- `location_city`: Transaction location city
- `location_state`: Transaction location state
- `location_country`: Transaction location country
- `created`: Timestamp
- `last_updated`: Timestamp

**Indexes**:
- `account_id`: Index for filtering by account
- `transaction_date`: Index for date range queries
- `provider_transaction_id`: Index for deduplication checks
- `category`: Index for category filtering

**Relationships**:
- Many-to-One with `financial_accounts`

**Constraints**:
- Unique constraint on `(account_id, provider_transaction_id)` to prevent duplicate transactions

### balance_snapshots (Optional)
**Primary Key**: `snapshot_id` (UUID)

Stores historical balance data for charting and analysis.

**Fields**:
- `snapshot_id`: UUID primary key
- `account_id`: Foreign key to `financial_accounts.account_id` (CASCADE DELETE)
- `balance`: Decimal (19,4) - Balance at snapshot time
- `currency`: ISO currency code (default: USD)
- `snapshot_date`: Timestamp - When snapshot was taken
- `created`: Timestamp

**Indexes**:
- `(account_id, snapshot_date)`: Composite index for time-series queries

**Relationships**:
- Many-to-One with `financial_accounts`

## Data Types

### Enums

**connection_status**:
- `authorizing`: Connection is being authorized
- `connected`: Connection is active and syncing
- `disconnected`: User disconnected the connection
- `error`: Connection has an error
- `expired`: Access token has expired

**account_type**:
- `credit_card`: Credit card account
- `checking`: Checking account
- `savings`: Savings account
- `investment`: Investment account

**transaction_type**:
- `debit`: Debit transaction (spending/withdrawal)
- `credit`: Credit transaction (payment/deposit)

**transaction_status**:
- `posted`: Transaction has been posted
- `pending`: Transaction is pending
- `refunded`: Transaction has been refunded

### Decimal Precision

All financial amounts use `decimal(19,4)` for precision:
- 19 total digits
- 4 decimal places
- Supports values up to 999,999,999,999,999.9999

This ensures no floating-point precision errors in financial calculations.

## Index Strategy

### Primary Indexes
- All tables have UUID primary keys with default indexes

### Foreign Key Indexes
- `provider_connections.user_id`: For user queries
- `provider_connections.provider_id`: For provider queries
- `financial_accounts.connection_id`: For connection queries
- `financial_transactions.account_id`: For account queries
- `balance_snapshots.account_id`: For account queries

### Composite Indexes
- `provider_connections(user_id, provider_id)`: For unique connection lookup
- `balance_snapshots(account_id, snapshot_date)`: For time-series queries

### Query Performance Indexes
- `provider_connections.status`: For filtering by connection status
- `financial_transactions.transaction_date`: For date range queries
- `financial_transactions.category`: For category filtering
- `financial_transactions.provider_transaction_id`: For deduplication

## Data Flow Diagrams

### Connection Flow

```
User → POST /api/financial/connections
  → Create connection (status: authorizing)
  → Return authorizeUrl
  → User visits authorize page
  → POST /api/financial/connections/[id]/authorize
  → Generate fake access token
  → Encrypt and store token
  → Generate accounts (Faker)
  → Generate transactions (Faker)
  → Update status to 'connected'
  → Redirect to dashboard
```

### Sync Flow

```
User → POST /api/financial/connections/[id] (sync)
  → Verify connection status
  → Update last_synced_at
  → (Future: Fetch new data from provider API)
  → Return sync result
```

### Data Retrieval Flow

```
User → GET /api/financial/accounts
  → Query accounts with user_id filter
  → Join with connections and providers
  → Return account list

User → GET /api/financial/transactions
  → Query transactions with user_id filter
  → Apply filters (date, category, type)
  → Paginate results
  → Return transaction list
```

## Connection Lifecycle State Machine

```
[Start]
   │
   ▼
authorizing ──► [User authorizes] ──► connected
   │                                      │
   │                                      │
   │                                      ▼
   │                              [Sync data]
   │                                      │
   │                                      ▼
   │                              [Update last_synced_at]
   │                                      │
   │                                      │
   └──► [Error occurs] ──► error ─────────┘
                              │
                              │
   [User disconnects] ──► disconnected
                              │
                              │
   [Token expires] ──► expired
```

## Security Considerations

### Encryption
- Access tokens are encrypted using AES-256-GCM before storage
- Encryption key is derived from `SESSION_SECRET` using PBKDF2
- Each token has a unique salt and IV

### Authorization
- All API routes require authentication via `getCurrentUser()`
- User can only access their own connections/accounts/transactions
- Database queries include `user_id` filter in WHERE clauses

### Validation
- All inputs validated using Zod schemas
- Foreign key constraints enforce referential integrity
- Unique constraints prevent duplicate connections/accounts/transactions

## Mock Data Generation Flow

```
Authorize Connection
  │
  ▼
Generate Access Token (Faker)
  │
  ▼
Generate 1-3 Accounts (Faker)
  │
  ├─► For each account:
  │     │
  │     ├─► Generate account number (masked)
  │     ├─► Generate balance (based on account type)
  │     ├─► Generate credit limit (if credit card)
  │     ├─► Generate statement/due dates (if credit card)
  │     │
  │     └─► Generate 3-6 months of transactions
  │           │
  │           ├─► 20-100 transactions per month
  │           ├─► Realistic merchant names
  │           ├─► Category assignments
  │           ├─► Location data
  │           └─► Transaction type (debit/credit)
  │
  └─► Store all data in database
```

## API Endpoint Flow

```
┌─────────────────────────────────────────────────────────┐
│                    API Endpoints                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  GET  /api/financial/providers                          │
│  └─► List all available providers                      │
│                                                          │
│  GET  /api/financial/connections                        │
│  └─► List user's connections                           │
│                                                          │
│  POST /api/financial/connections                        │
│  └─► Create new connection (status: authorizing)        │
│                                                          │
│  GET  /api/financial/connections/[id]                   │
│  └─► Get connection details                             │
│                                                          │
│  POST /api/financial/connections/[id]                   │
│  └─► Sync connection                                    │
│                                                          │
│  DELETE /api/financial/connections/[id]                  │
│  └─► Disconnect provider                                │
│                                                          │
│  POST /api/financial/connections/[id]/authorize         │
│  └─► Complete authorization (generate data)            │
│                                                          │
│  GET  /api/financial/accounts                           │
│  └─► List user's accounts (with filters)                │
│                                                          │
│  GET  /api/financial/accounts/[id]                      │
│  └─► Get account details                                │
│                                                          │
│  GET  /api/financial/accounts/[id]/transactions         │
│  └─► Get transactions for account (with filters)        │
│                                                          │
│  GET  /api/financial/transactions                       │
│  └─► List all user's transactions (with filters)        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Notes

1. **Balance Storage**: Balances are stored as provided by the provider (not calculated from transactions). This matches real-world API behavior where providers provide authoritative balance data.

2. **Transaction Types**: The `type` field (debit/credit) is critical for proper display:
   - Credit cards: debits are purchases (negative), credits are payments (positive)
   - Checking/savings: debits are withdrawals (negative), credits are deposits (positive)

3. **Deduplication**: `provider_account_id` and `provider_transaction_id` prevent duplicate accounts/transactions when syncing.

4. **Cascade Deletes**: Deleting a connection cascades to accounts and transactions. This ensures data consistency.

5. **Historical Tracking**: `balance_snapshots` table is optional but enables balance history charting and analysis.

6. **Pagination**: Transaction endpoints use cursor-based pagination for performance with large datasets.
