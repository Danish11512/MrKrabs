import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch complete user data from database
    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.userID, currentUser.userID))
      .limit(1)

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = userData

    // Add computed fields if needed (e.g., account summary)
    const userProfile = {
      ...userWithoutPassword,
      // Future: Add computed fields like account summary, transaction count, etc.
    }

    return NextResponse.json(
      { user: userProfile },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60', // Cache for 1 minute
        },
      },
    )
  } catch (error) {
    console.error('User data fetch error:', error)
    return NextResponse.json(
      { error: 'An error occurred fetching user data' },
      { status: 500 },
    )
  }
}
