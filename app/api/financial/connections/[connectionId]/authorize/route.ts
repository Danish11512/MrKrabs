import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { providerConnections, financialProviders, financialAccounts, financialTransactions } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/session'
import { encrypt } from '@/lib/auth/encryption'
import { generateAccessToken, generateAccounts, generateTransactions } from '@/lib/financial/faker-generators'

interface RouteParams {
  params: Promise<{ connectionId: string }>
}

export async function POST(
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

    const { connectionId } = await params

    // Get connection with provider info
    const [connection] = await db
      .select({
        connectionID: providerConnections.connectionID,
        userID: providerConnections.userID,
        providerID: providerConnections.providerID,
        status: providerConnections.status,
        provider: {
          providerID: financialProviders.providerID,
          supportedAccountTypes: financialProviders.supportedAccountTypes,
        },
      })
      .from(providerConnections)
      .innerJoin(financialProviders, eq(providerConnections.providerID, financialProviders.providerID))
      .where(
        and(
          eq(providerConnections.connectionID, connectionId),
          eq(providerConnections.userID, user.userID),
        ),
      )
      .limit(1)

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 },
      )
    }

    if (connection.status !== 'authorizing') {
      return NextResponse.json(
        { error: 'Connection is not in authorizing state' },
        { status: 400 },
      )
    }

    // Generate fake access token
    const accessToken = generateAccessToken()
    const encryptedToken = encrypt(accessToken)

    // Generate accounts and transactions
    const accountTypes = connection.provider.supportedAccountTypes as Array<'credit_card' | 'checking' | 'savings' | 'investment'>
    const accountsData = generateAccounts(connectionId, accountTypes)

    // Insert accounts
    const insertedAccounts = await db
      .insert(financialAccounts)
      .values(accountsData)
      .returning()

    // Generate transactions for each account
    for (const account of insertedAccounts) {
      const transactionsData = generateTransactions(
        account.accountID,
        account.accountType as 'credit_card' | 'checking' | 'savings' | 'investment',
      )

      if (transactionsData.length > 0) {
        await db.insert(financialTransactions).values(transactionsData)
      }
    }

    // Update connection status to "connected"
    const now = new Date()
    await db
      .update(providerConnections)
      .set({
        accessToken: encryptedToken,
        status: 'connected',
        lastSyncedAt: now,
      })
      .where(eq(providerConnections.connectionID, connectionId))

    return NextResponse.json(
      {
        success: true,
        connectionID: connectionId,
        status: 'connected',
        accountsCreated: insertedAccounts.length,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error authorizing connection:', error)
    return NextResponse.json(
      { error: 'Failed to authorize connection' },
      { status: 500 },
    )
  }
}
