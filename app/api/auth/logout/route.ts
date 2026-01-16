import { NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth/session'

export async function POST(): Promise<NextResponse> {
  try {
    await destroySession()
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 },
    )
  }
}
