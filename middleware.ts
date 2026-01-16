import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/auth/session-config'
import type { UserWithoutPassword } from '@/types'

type Session = {
  user?: UserWithoutPassword
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (pathname === '/' || pathname === '/login' || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Protect dashboard route
  if (pathname.startsWith('/dashboard')) {
    const cookieStore = await cookies()
    const session = await getIronSession(cookieStore, sessionOptions) as Session

    if (!session.user) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
