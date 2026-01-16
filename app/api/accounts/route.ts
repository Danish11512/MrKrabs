import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { financialAccounts } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/session'
import type { FinancialAccount, AccountType } from '@/types'

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
    const accountType = searchParams.get('type') as AccountType | null

    // Build conditions array
    const conditions = [eq(financialAccounts.userID, user.userID)]

    if (accountType) {
      conditions.push(eq(financialAccounts.accountType, accountType))
    }

    // Build query
    const accounts = await db
      .select()
      .from(financialAccounts)
      .where(and(...conditions))

    const response: FinancialAccount[] = accounts.map((a) => ({
      accountID: a.accountID,
      userID: a.userID,
      accountNumber: a.accountNumber,
      accountType: a.accountType as AccountType,
      accountSubtype: a.accountSubtype,
      balance: a.balance,
      currency: a.currency,
      creditLimit: a.creditLimit,
      statementDate: a.statementDate,
      dueDate: a.dueDate,
      name: a.name,
      created: a.created,
      lastUpdated: a.lastUpdated,
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
      accountType,
      name,
      accountNumber,
      accountSubtype,
      balance = '0',
      currency = 'USD',
      creditLimit,
      statementDate,
      dueDate,
    } = body

    // Validate required fields
    if (!accountType || !name) {
      return NextResponse.json(
        { error: 'accountType and name are required' },
        { status: 400 },
      )
    }

    // Create account
    const [newAccount] = await db
      .insert(financialAccounts)
      .values({
        userID: user.userID,
        accountType,
        name,
        accountNumber: accountNumber || null,
        accountSubtype: accountSubtype || null,
        balance,
        currency,
        creditLimit: creditLimit || null,
        statementDate: statementDate ? new Date(statementDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
      })
      .returning()

    const response: FinancialAccount = {
      accountID: newAccount.accountID,
      userID: newAccount.userID,
      accountNumber: newAccount.accountNumber,
      accountType: newAccount.accountType as AccountType,
      accountSubtype: newAccount.accountSubtype,
      balance: newAccount.balance,
      currency: newAccount.currency,
      creditLimit: newAccount.creditLimit,
      statementDate: newAccount.statementDate,
      dueDate: newAccount.dueDate,
      name: newAccount.name,
      created: newAccount.created,
      lastUpdated: newAccount.lastUpdated,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 },
    )
  }
}
