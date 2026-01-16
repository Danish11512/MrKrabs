import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { financialProviders } from '@/lib/db/schema'
import type { FinancialProvider } from '@/types'

export async function GET(): Promise<NextResponse> {
  try {
    const providers = await db.select().from(financialProviders)

    const response: FinancialProvider[] = providers.map((p) => ({
      providerID: p.providerID,
      name: p.name,
      slug: p.slug,
      logoUrl: p.logoUrl,
      supportedAccountTypes: p.supportedAccountTypes as FinancialProvider['supportedAccountTypes'],
      created: p.created,
      lastUpdated: p.lastUpdated,
    }))

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 },
    )
  }
}
