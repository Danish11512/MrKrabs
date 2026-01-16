import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/auth/session-config'

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (pathname === '/' || pathname === '/login' || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Protect dashboard route
  if (pathname.startsWith('/dashboard')) {
    const session = await getIronSession(request.cookies, sessionOptions)

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
