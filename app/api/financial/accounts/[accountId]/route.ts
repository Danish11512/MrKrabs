import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { financialAccounts, providerConnections } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/session'
import type { FinancialAccount } from '@/types'

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
      .select({
        accountID: financialAccounts.accountID,
        connectionID: financialAccounts.connectionID,
        providerAccountID: financialAccounts.providerAccountID,
        accountNumber: financialAccounts.accountNumber,
        accountType: financialAccounts.accountType,
        accountSubtype: financialAccounts.accountSubtype,
        balance: financialAccounts.balance,
        currency: financialAccounts.currency,
        creditLimit: financialAccounts.creditLimit,
        statementDate: financialAccounts.statementDate,
        dueDate: financialAccounts.dueDate,
        name: financialAccounts.name,
        created: financialAccounts.created,
        lastUpdated: financialAccounts.lastUpdated,
      })
      .from(financialAccounts)
      .innerJoin(providerConnections, eq(financialAccounts.connectionID, providerConnections.connectionID))
      .where(
        and(
          eq(financialAccounts.accountID, accountId),
          eq(providerConnections.userID, user.userID),
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
      connectionID: account.connectionID,
      providerAccountID: account.providerAccountID,
      accountNumber: account.accountNumber,
      accountType: account.accountType as FinancialAccount['accountType'],
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
