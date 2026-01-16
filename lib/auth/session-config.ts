export const sessionOptions = {
  password: process.env.SESSION_SECRET || 'change-me-in-production-min-32-chars',
  cookieName: 'mrkrabs-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax' as const,
  },
}
