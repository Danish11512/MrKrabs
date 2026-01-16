-- Migration: Remove provider connections and simplify schema
-- This migration transforms the schema from provider-based to user-based accounts

-- Step 1: Add user_id column to financial_accounts (nullable first)
ALTER TABLE "financial_accounts" ADD COLUMN "user_id" uuid;

-- Step 2: Migrate existing data - assign userID from connections
UPDATE "financial_accounts" 
SET "user_id" = (
  SELECT "user_id" 
  FROM "provider_connections" 
  WHERE "provider_connections"."connection_id" = "financial_accounts"."connection_id"
)
WHERE "connection_id" IS NOT NULL;

-- Step 3: Delete accounts without valid connections (orphaned accounts)
DELETE FROM "financial_accounts" WHERE "user_id" IS NULL;

-- Step 4: Make user_id NOT NULL and add foreign key
ALTER TABLE "financial_accounts" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_user_id_users_user_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;

-- Step 5: Make name required (set default for existing null values, then make NOT NULL)
UPDATE "financial_accounts" SET "name" = 'Account' WHERE "name" IS NULL;
ALTER TABLE "financial_accounts" ALTER COLUMN "name" SET NOT NULL;

-- Step 6: Drop old columns from financial_accounts
ALTER TABLE "financial_accounts" DROP COLUMN "connection_id";
ALTER TABLE "financial_accounts" DROP COLUMN "provider_account_id";

-- Step 7: Drop old index on connection_id (if exists)
DROP INDEX IF EXISTS "connection_idx";
DROP INDEX IF EXISTS "provider_account_idx";

-- Step 8: Create new index on user_id
CREATE INDEX "user_idx" ON "financial_accounts" USING btree ("user_id");

-- Step 9: Drop provider_transaction_id from financial_transactions
ALTER TABLE "financial_transactions" DROP COLUMN "provider_transaction_id";

-- Step 10: Drop old index on provider_transaction_id (if exists)
DROP INDEX IF EXISTS "provider_transaction_idx";

-- Step 11: Drop provider_connections table (cascade will handle foreign keys)
DROP TABLE IF EXISTS "provider_connections" CASCADE;

-- Step 12: Drop financial_providers table
DROP TABLE IF EXISTS "financial_providers" CASCADE;

-- Step 13: Drop connection_status enum (if not used elsewhere)
DROP TYPE IF EXISTS "connection_status";

-- Step 14: Remove validated column from users
ALTER TABLE "users" DROP COLUMN IF EXISTS "validated";
