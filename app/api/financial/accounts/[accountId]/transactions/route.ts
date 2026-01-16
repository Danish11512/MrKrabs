import { NextRequest, NextResponse } from 'next/server'
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { financialTransactions, financialAccounts, providerConnections } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/session'
import type { FinancialTransactionWithAccount, TransactionFilters } from '@/types'

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
    const searchParams = request.nextUrl.searchParams

    // Verify account belongs to user
    const [account] = await db
      .select()
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

    // Build filters
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const cursor = searchParams.get('cursor')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build conditions array
    const conditions = [eq(financialTransactions.accountID, accountId)]

    if (startDate) {
      conditions.push(gte(financialTransactions.transactionDate, new Date(startDate)))
    }

    if (endDate) {
      conditions.push(lte(financialTransactions.transactionDate, new Date(endDate)))
    }

    if (category) {
      conditions.push(eq(financialTransactions.category, category))
    }

    if (status) {
      conditions.push(eq(financialTransactions.status, status))
    }

    if (type) {
      conditions.push(eq(financialTransactions.type, type))
    }

    if (cursor) {
      conditions.push(lte(financialTransactions.transactionID, cursor))
    }

    // Build query
    let query = db
      .select({
        transactionID: financialTransactions.transactionID,
        accountID: financialTransactions.accountID,
        providerTransactionID: financialTransactions.providerTransactionID,
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
      .where(and(...conditions))

    // Sorting (default: newest first)
    if (sortBy === 'date') {
      query = query.orderBy(sortOrder === 'desc' ? desc(financialTransactions.transactionDate) : asc(financialTransactions.transactionDate))
    } else if (sortBy === 'amount') {
      query = query.orderBy(sortOrder === 'desc' ? desc(financialTransactions.amount) : asc(financialTransactions.amount))
    }

    const transactions = await query.limit(limit + 1)

    const hasMore = transactions.length > limit
    const result = hasMore ? transactions.slice(0, limit) : transactions
    const nextCursor = hasMore ? result[result.length - 1]?.transactionID : undefined

    const response: FinancialTransactionWithAccount[] = result.map((t) => ({
      transactionID: t.transactionID,
      accountID: t.accountID,
      providerTransactionID: t.providerTransactionID,
      amount: t.amount,
      type: t.type as FinancialTransactionWithAccount['type'],
      currency: t.currency,
      description: t.description,
      merchant: t.merchant,
      category: t.category,
      status: t.status as FinancialTransactionWithAccount['status'],
      transactionDate: t.transactionDate,
      postedDate: t.postedDate,
      locationCity: t.locationCity,
      locationState: t.locationState,
      locationCountry: t.locationCountry,
      created: t.created,
      lastUpdated: t.lastUpdated,
      account: {
        accountID: t.account.accountID,
        accountNumber: t.account.accountNumber,
        accountType: t.account.accountType,
        name: t.account.name,
      },
    }))

    return NextResponse.json({
      transactions: response,
      pagination: {
        cursor: nextCursor,
        hasMore,
      },
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 },
    )
  }
}
