import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { financialTransactions, financialAccounts } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/session'
import type { FinancialTransactionWithAccount, TransactionType, TransactionStatus } from '@/types'

interface RouteParams {
  params: Promise<{ transactionId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { transactionId } = await params

    const [transaction] = await db
      .select({
        transactionID: financialTransactions.transactionID,
        accountID: financialTransactions.accountID,
        amount: financialTransactions.amount,
        type: financialTransactions.type,
        currency: financialTransactions.currency,
        description: financialTransactions.description,
        merchant: financialTransactions.merchant,
        category: financialTransactions.category,
        status: financialTransactions.status,
        transactionDate: financialTransactions.transactionDate,
        postedDate: financialTransactions.postedDate,
        locationCity: financialTransactions.locationCity,
        locationState: financialTransactions.locationState,
        locationCountry: financialTransactions.locationCountry,
        created: financialTransactions.created,
        lastUpdated: financialTransactions.lastUpdated,
        account: {
          accountID: financialAccounts.accountID,
          accountNumber: financialAccounts.accountNumber,
          accountType: financialAccounts.accountType,
          name: financialAccounts.name,
        },
      })
      .from(financialTransactions)
      .innerJoin(financialAccounts, eq(financialTransactions.accountID, financialAccounts.accountID))
      .where(
        and(
          eq(financialTransactions.transactionID, transactionId),
          eq(financialAccounts.userID, user.userID),
        ),
      )
      .limit(1)

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      )
    }

    const response: FinancialTransactionWithAccount = {
      transactionID: transaction.transactionID,
      accountID: transaction.accountID,
      amount: transaction.amount,
      type: transaction.type as TransactionType,
      currency: transaction.currency,
      description: transaction.description,
      merchant: transaction.merchant,
      category: transaction.category,
      status: transaction.status as TransactionStatus,
      transactionDate: transaction.transactionDate,
      postedDate: transaction.postedDate,
      locationCity: transaction.locationCity,
      locationState: transaction.locationState,
      locationCountry: transaction.locationCountry,
      created: transaction.created,
      lastUpdated: transaction.lastUpdated,
      account: {
        accountID: transaction.account.accountID,
        accountNumber: transaction.account.accountNumber,
        accountType: transaction.account.accountType,
        name: transaction.account.name,
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { transactionId } = await params
    const body = await request.json()

    // Verify transaction belongs to user's account
    const [existingTransaction] = await db
      .select({
        transactionID: financialTransactions.transactionID,
        accountID: financialTransactions.accountID,
      })
      .from(financialTransactions)
      .innerJoin(financialAccounts, eq(financialTransactions.accountID, financialAccounts.accountID))
      .where(
        and(
          eq(financialTransactions.transactionID, transactionId),
          eq(financialAccounts.userID, user.userID),
        ),
      )
      .limit(1)

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      )
    }

    // Update transaction
    const [updatedTransaction] = await db
      .update(financialTransactions)
      .set({
        ...body,
        lastUpdated: new Date(),
      })
      .where(eq(financialTransactions.transactionID, transactionId))
      .returning()

    // Fetch account details for response
    const [accountDetails] = await db
      .select()
      .from(financialAccounts)
      .where(eq(financialAccounts.accountID, updatedTransaction.accountID))
      .limit(1)

    const response: FinancialTransactionWithAccount = {
      transactionID: updatedTransaction.transactionID,
      accountID: updatedTransaction.accountID,
      amount: updatedTransaction.amount,
      type: updatedTransaction.type as TransactionType,
      currency: updatedTransaction.currency,
      description: updatedTransaction.description,
      merchant: updatedTransaction.merchant,
      category: updatedTransaction.category,
      status: updatedTransaction.status as TransactionStatus,
      transactionDate: updatedTransaction.transactionDate,
      postedDate: updatedTransaction.postedDate,
      locationCity: updatedTransaction.locationCity,
      locationState: updatedTransaction.locationState,
      locationCountry: updatedTransaction.locationCountry,
      created: updatedTransaction.created,
      lastUpdated: updatedTransaction.lastUpdated,
      account: {
        accountID: accountDetails!.accountID,
        accountNumber: accountDetails!.accountNumber,
        accountType: accountDetails!.accountType,
        name: accountDetails!.name,
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { transactionId } = await params

    // Verify transaction belongs to user's account
    const [existingTransaction] = await db
      .select({
        transactionID: financialTransactions.transactionID,
      })
      .from(financialTransactions)
      .innerJoin(financialAccounts, eq(financialTransactions.accountID, financialAccounts.accountID))
      .where(
        and(
          eq(financialTransactions.transactionID, transactionId),
          eq(financialAccounts.userID, user.userID),
        ),
      )
      .limit(1)

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      )
    }

    // Delete transaction
    await db
      .delete(financialTransactions)
      .where(eq(financialTransactions.transactionID, transactionId))

    return NextResponse.json(
      { success: true },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 },
    )
  }
}
