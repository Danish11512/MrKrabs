import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { providerConnections, financialProviders } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/session'
import { encrypt } from '@/lib/auth/encryption'
import type { ProviderConnectionWithProvider } from '@/types'

const createConnectionSchema = z.object({
  providerID: z.string().uuid('Invalid provider ID'),
})

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const connections = await db
      .select({
        connectionID: providerConnections.connectionID,
        userID: providerConnections.userID,
        providerID: providerConnections.providerID,
        accessToken: providerConnections.accessToken,
        status: providerConnections.status,
        lastSyncedAt: providerConnections.lastSyncedAt,
        errorMessage: providerConnections.errorMessage,
        created: providerConnections.created,
        lastUpdated: providerConnections.lastUpdated,
        provider: {
          providerID: financialProviders.providerID,
          name: financialProviders.name,
          slug: financialProviders.slug,
          logoUrl: financialProviders.logoUrl,
        },
      })
      .from(providerConnections)
      .innerJoin(financialProviders, eq(providerConnections.providerID, financialProviders.providerID))
      .where(eq(providerConnections.userID, user.userID))

    const response: ProviderConnectionWithProvider[] = connections.map((c) => ({
      connectionID: c.connectionID,
      userID: c.userID,
      providerID: c.providerID,
      accessToken: c.accessToken, // Still encrypted, but returned for reference
      status: c.status as ProviderConnectionWithProvider['status'],
      lastSyncedAt: c.lastSyncedAt,
      errorMessage: c.errorMessage,
      created: c.created,
      lastUpdated: c.lastUpdated,
      provider: {
        providerID: c.provider.providerID,
        name: c.provider.name,
        slug: c.provider.slug,
        logoUrl: c.provider.logoUrl,
      },
    }))

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching connections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
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
    const validatedData = createConnectionSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validatedData.error.errors },
        { status: 400 },
      )
    }

    const { providerID } = validatedData.data

    // Verify provider exists
    const [provider] = await db
      .select()
      .from(financialProviders)
      .where(eq(financialProviders.providerID, providerID))
      .limit(1)

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 },
      )
    }

    // Check if connection already exists
    const [existing] = await db
      .select()
      .from(providerConnections)
      .where(
        and(
          eq(providerConnections.userID, user.userID),
          eq(providerConnections.providerID, providerID),
        ),
      )
      .limit(1)

    if (existing) {
      return NextResponse.json(
        { error: 'Connection already exists', connectionID: existing.connectionID },
        { status: 409 },
      )
    }

    // Create connection with "authorizing" status
    // Generate a placeholder token (will be replaced during authorization)
    const placeholderToken = 'pending_authorization'
    const encryptedToken = encrypt(placeholderToken)

    const [newConnection] = await db
      .insert(providerConnections)
      .values({
        userID: user.userID,
        providerID,
        accessToken: encryptedToken,
        status: 'authorizing',
      })
      .returning()

    return NextResponse.json(
      {
        connectionID: newConnection.connectionID,
        status: newConnection.status,
        authorizeUrl: `/financial/authorize/${newConnection.connectionID}`,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error creating connection:', error)
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 },
    )
  }
}
