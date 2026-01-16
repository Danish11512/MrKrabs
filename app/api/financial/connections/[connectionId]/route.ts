import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { providerConnections, financialAccounts, financialTransactions } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/session'
import type { SyncConnectionResult } from '@/types'

interface RouteParams {
  params: Promise<{ connectionId: string }>
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

    const { connectionId } = await params

    const [connection] = await db
      .select()
      .from(providerConnections)
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

    return NextResponse.json(connection, { status: 200 })
  } catch (error) {
    console.error('Error fetching connection:', error)
    return NextResponse.json(
      { error: 'Failed to fetch connection' },
      { status: 500 },
    )
  }
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

    const [connection] = await db
      .select()
      .from(providerConnections)
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

    if (connection.status !== 'connected') {
      return NextResponse.json(
        { error: 'Connection is not active' },
        { status: 400 },
      )
    }

    // For now, sync just updates the lastSyncedAt timestamp
    // In a real implementation, this would fetch new data from the provider API
    const now = new Date()
    await db
      .update(providerConnections)
      .set({ lastSyncedAt: now })
      .where(eq(providerConnections.connectionID, connectionId))

    // Count accounts and transactions for this connection
    const accounts = await db
      .select()
      .from(financialAccounts)
      .where(eq(financialAccounts.connectionID, connectionId))

    const transactionsCount = await db
      .select()
      .from(financialTransactions)
      .where(
        eq(
          financialTransactions.accountID,
          accounts[0]?.accountID || '',
        ),
      )

    const result: SyncConnectionResult = {
      syncedAt: now,
      accountsUpdated: accounts.length,
      transactionsAdded: 0, // Would be calculated from new transactions in real implementation
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error syncing connection:', error)
    return NextResponse.json(
      { error: 'Failed to sync connection' },
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

    const { connectionId } = await params

    const [connection] = await db
      .select()
      .from(providerConnections)
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

    // Delete connection (cascade will delete accounts and transactions)
    await db
      .delete(providerConnections)
      .where(eq(providerConnections.connectionID, connectionId))

    return NextResponse.json(
      { success: true },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error deleting connection:', error)
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 },
    )
  }
}
