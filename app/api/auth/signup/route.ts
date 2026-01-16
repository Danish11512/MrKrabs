import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { hashPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'
import { signupSchema } from '@/lib/auth/validation'
import type { UserWithoutPassword } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const validatedData = signupSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input. Please check all fields.' },
        { status: 400 },
      )
    }

    const { firstName, lastName, email, password, phoneNumber } = validatedData.data

    // Check if email already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 },
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phoneNumber: phoneNumber || null,
        validated: false,
      })
      .returning()

    const userWithoutPassword: UserWithoutPassword = {
      userID: newUser.userID,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      created: newUser.created,
      lastUpdated: newUser.lastUpdated,
      phoneNumber: newUser.phoneNumber,
      validated: newUser.validated,
    }

    // Create session
    await createSession(userWithoutPassword)

    return NextResponse.json(
      { success: true, user: userWithoutPassword },
      { status: 201 },
    )
  } catch (error) {
    console.error('Signup error:', error)
    
    // Check if error is related to database connection or missing table
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('role') && errorMessage.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: 'Database connection failed. Please update DATABASE_URL in .env.local with valid credentials or use peer authentication (postgresql:///mrkrabs)',
          details: 'The current DATABASE_URL has invalid credentials. Run: ./setup-auth.sh or update .env.local manually'
        },
        { status: 500 },
      )
    }
    
    if (errorMessage.includes('users') && errorMessage.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: 'Database table missing. Please run: bun run db:push to sync the database schema',
          details: 'The users table does not exist in the database'
        },
        { status: 500 },
      )
    }
    
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 },
    )
  }
}
