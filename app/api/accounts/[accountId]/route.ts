import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { financialAccounts } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/session'
import type { FinancialAccount, AccountType } from '@/types'

interface RouteParams {
  params: Promise<{ accountId: string }>
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

    const { accountId } = await params

    const [account] = await db
      .select()
      .from(financialAccounts)
      .where(
        and(
          eq(financialAccounts.accountID, accountId),
          eq(financialAccounts.userID, user.userID),
        ),
      )
      .limit(1)

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 },
      )
    }

    const response: FinancialAccount = {
      accountID: account.accountID,
      userID: account.userID,
      accountNumber: account.accountNumber,
      accountType: account.accountType as AccountType,
      accountSubtype: account.accountSubtype,
      balance: account.balance,
      currency: account.currency,
      creditLimit: account.creditLimit,
      statementDate: account.statementDate,
      dueDate: account.dueDate,
      name: account.name,
      created: account.created,
      lastUpdated: account.lastUpdated,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching account:', error)
    return NextResponse.json(
      { error: 'Failed to fetch account' },
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

    const { accountId } = await params
    const body = await request.json()

    // Verify account belongs to user
    const [existingAccount] = await db
      .select()
      .from(financialAccounts)
      .where(
        and(
          eq(financialAccounts.accountID, accountId),
          eq(financialAccounts.userID, user.userID),
        ),
      )
      .limit(1)

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 },
      )
    }

    // Update account
    const [updatedAccount] = await db
      .update(financialAccounts)
      .set({
        ...body,
        lastUpdated: new Date(),
      })
      .where(eq(financialAccounts.accountID, accountId))
      .returning()

    const response: FinancialAccount = {
      accountID: updatedAccount.accountID,
      userID: updatedAccount.userID,
      accountNumber: updatedAccount.accountNumber,
      accountType: updatedAccount.accountType as AccountType,
      accountSubtype: updatedAccount.accountSubtype,
      balance: updatedAccount.balance,
      currency: updatedAccount.currency,
      creditLimit: updatedAccount.creditLimit,
      statementDate: updatedAccount.statementDate,
      dueDate: updatedAccount.dueDate,
      name: updatedAccount.name,
      created: updatedAccount.created,
      lastUpdated: updatedAccount.lastUpdated,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json(
      { error: 'Failed to update account' },
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

    const { accountId } = await params

    // Verify account belongs to user
    const [existingAccount] = await db
      .select()
      .from(financialAccounts)
      .where(
        and(
          eq(financialAccounts.accountID, accountId),
          eq(financialAccounts.userID, user.userID),
        ),
      )
      .limit(1)

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 },
      )
    }

    // Delete account (cascade will handle transactions)
    await db
      .delete(financialAccounts)
      .where(eq(financialAccounts.accountID, accountId))

    return NextResponse.json(
      { success: true },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 },
    )
  }
}
