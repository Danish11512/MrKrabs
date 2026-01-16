import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { financialAccounts, providerConnections, financialProviders } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/session'
import type { FinancialAccountWithConnection } from '@/types'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const searchParams = request.nextUrl.searchParams
    const connectionId = searchParams.get('connectionId')
    const accountType = searchParams.get('type')
    const providerId = searchParams.get('providerId')

    // Build conditions array
    const conditions = [eq(providerConnections.userID, user.userID)]

    if (connectionId) {
      conditions.push(eq(financialAccounts.connectionID, connectionId))
    }

    if (providerId) {
      conditions.push(eq(providerConnections.providerID, providerId))
    }

    if (accountType) {
      conditions.push(eq(financialAccounts.accountType, accountType))
    }

    // Build query
    const accounts = await db
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
        connection: {
          connectionID: providerConnections.connectionID,
          provider: {
            name: financialProviders.name,
            slug: financialProviders.slug,
          },
        },
      })
      .from(financialAccounts)
      .innerJoin(providerConnections, eq(financialAccounts.connectionID, providerConnections.connectionID))
      .innerJoin(financialProviders, eq(providerConnections.providerID, financialProviders.providerID))
      .where(and(...conditions))

    const response: FinancialAccountWithConnection[] = accounts.map((a) => ({
      accountID: a.accountID,
      connectionID: a.connectionID,
      providerAccountID: a.providerAccountID,
      accountNumber: a.accountNumber,
      accountType: a.accountType as FinancialAccountWithConnection['accountType'],
      accountSubtype: a.accountSubtype,
      balance: a.balance,
      currency: a.currency,
      creditLimit: a.creditLimit,
      statementDate: a.statementDate,
      dueDate: a.dueDate,
      name: a.name,
      created: a.created,
      lastUpdated: a.lastUpdated,
      connection: {
        connectionID: a.connection.connectionID,
        provider: {
          name: a.connection.provider.name,
          slug: a.connection.provider.slug,
        },
      },
    }))

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 },
    )
  }
}
