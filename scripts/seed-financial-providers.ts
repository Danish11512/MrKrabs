import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { financialProviders } from '@/lib/db/schema'
import type { AccountType } from '@/types'

const providers: Array<{
  name: string
  slug: string
  logoUrl?: string
  supportedAccountTypes: AccountType[]
}> = [
  {
    name: 'American Express',
    slug: 'amex',
    logoUrl: 'https://logo.clearbit.com/americanexpress.com',
    supportedAccountTypes: ['credit_card'],
  },
  {
    name: 'Chase Bank',
    slug: 'chase',
    logoUrl: 'https://logo.clearbit.com/chase.com',
    supportedAccountTypes: ['credit_card', 'checking', 'savings'],
  },
  {
    name: 'Bank of America',
    slug: 'bofa',
    logoUrl: 'https://logo.clearbit.com/bankofamerica.com',
    supportedAccountTypes: ['credit_card', 'checking', 'savings'],
  },
  {
    name: 'Wells Fargo',
    slug: 'wells-fargo',
    logoUrl: 'https://logo.clearbit.com/wellsfargo.com',
    supportedAccountTypes: ['credit_card', 'checking', 'savings'],
  },
  {
    name: 'Capital One',
    slug: 'capital-one',
    logoUrl: 'https://logo.clearbit.com/capitalone.com',
    supportedAccountTypes: ['credit_card', 'checking', 'savings'],
  },
]

async function seedProviders() {
  console.log('Seeding financial providers...')

  try {
    for (const provider of providers) {
      // Check if provider already exists
      const existing = await db
        .select()
        .from(financialProviders)
        .where(eq(financialProviders.slug, provider.slug))
        .limit(1)

      if (existing.length > 0) {
        console.log(`Provider ${provider.slug} already exists, skipping...`)
        continue
      }

      await db.insert(financialProviders).values({
        name: provider.name,
        slug: provider.slug,
        logoUrl: provider.logoUrl || null,
        supportedAccountTypes: provider.supportedAccountTypes,
      })

      console.log(`✓ Seeded ${provider.name}`)
    }

    console.log('✓ Financial providers seeded successfully!')
  } catch (error) {
    console.error('Error seeding providers:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.main) {
  seedProviders()
    .then(() => {
      console.log('Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}
