import { NextRequest, NextResponse } from 'next/server'
import { eq, and, gte, lte, desc, asc, or, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { financialTransactions, financialAccounts } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/session'
import type { TransactionListResponse, FinancialTransactionWithAccount, TransactionType, TransactionStatus } from '@/types'

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
    const accountId = searchParams.get('accountId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')
    const status = searchParams.get('status') as TransactionStatus | null
    const type = searchParams.get('type') as TransactionType | null
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const cursor = searchParams.get('cursor')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Get all user's account IDs
    let userAccountIds = await db
      .select({ accountID: financialAccounts.accountID })
      .from(financialAccounts)
      .where(eq(financialAccounts.userID, user.userID))

    // Filter by account if provided
    if (accountId) {
      userAccountIds = userAccountIds.filter((a) => a.accountID === accountId)
    }

    if (userAccountIds.length === 0) {
      return NextResponse.json({
        transactions: [],
        pagination: {
          hasMore: false,
        },
      }, { status: 200 })
    }

    // Build query conditions
    const accountIdList = userAccountIds.map((a) => a.accountID)
    const conditions = [
      inArray(financialTransactions.accountID, accountIdList),
    ]

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

    // Build query with sorting
    const selectQuery = db
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
      .where(and(...conditions))

    // Apply sorting
    const sortedQuery = sortBy === 'date'
      ? selectQuery.orderBy(sortOrder === 'desc' ? desc(financialTransactions.transactionDate) : asc(financialTransactions.transactionDate))
      : sortBy === 'amount'
      ? selectQuery.orderBy(sortOrder === 'desc' ? desc(financialTransactions.amount) : asc(financialTransactions.amount))
      : selectQuery.orderBy(desc(financialTransactions.transactionDate))

    const transactions = await sortedQuery.limit(limit + 1)

    const hasMore = transactions.length > limit
    const result = hasMore ? transactions.slice(0, limit) : transactions
    const nextCursor = hasMore ? result[result.length - 1]?.transactionID : undefined

    const response: FinancialTransactionWithAccount[] = result.map((t) => ({
      transactionID: t.transactionID,
      accountID: t.accountID,
      amount: t.amount,
      type: t.type as TransactionType,
      currency: t.currency,
      description: t.description,
      merchant: t.merchant,
      category: t.category,
      status: t.status as TransactionStatus,
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const body = await request.json()
    const {
      accountID,
      amount,
      type,
      currency = 'USD',
      description,
      merchant,
      category,
      status = 'posted',
      transactionDate,
      postedDate,
      locationCity,
      locationState,
      locationCountry,
    } = body

    // Validate required fields
    if (!accountID || !amount || !type || !transactionDate) {
      return NextResponse.json(
        { error: 'accountID, amount, type, and transactionDate are required' },
        { status: 400 },
      )
    }

    // Verify account belongs to user
    const [account] = await db
      .select()
      .from(financialAccounts)
      .where(
        and(
          eq(financialAccounts.accountID, accountID),
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

    // Create transaction
    const [newTransaction] = await db
      .insert(financialTransactions)
      .values({
        accountID,
        amount,
        type,
        currency,
        description: description || null,
        merchant: merchant || null,
        category: category || null,
        status,
        transactionDate: new Date(transactionDate),
        postedDate: postedDate ? new Date(postedDate) : null,
        locationCity: locationCity || null,
        locationState: locationState || null,
        locationCountry: locationCountry || null,
      })
      .returning()

    // Fetch account details for response
    const [accountDetails] = await db
      .select()
      .from(financialAccounts)
      .where(eq(financialAccounts.accountID, accountID))
      .limit(1)

    const response: FinancialTransactionWithAccount = {
      transactionID: newTransaction.transactionID,
      accountID: newTransaction.accountID,
      amount: newTransaction.amount,
      type: newTransaction.type as TransactionType,
      currency: newTransaction.currency,
      description: newTransaction.description,
      merchant: newTransaction.merchant,
      category: newTransaction.category,
      status: newTransaction.status as TransactionStatus,
      transactionDate: newTransaction.transactionDate,
      postedDate: newTransaction.postedDate,
      locationCity: newTransaction.locationCity,
      locationState: newTransaction.locationState,
      locationCountry: newTransaction.locationCountry,
      created: newTransaction.created,
      lastUpdated: newTransaction.lastUpdated,
      account: {
        accountID: accountDetails!.accountID,
        accountNumber: accountDetails!.accountNumber,
        accountType: accountDetails!.accountType,
        name: accountDetails!.name,
      },
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 },
    )
  }
}
