import { getIronSession, IronSessionData } from 'iron-session'
import { cookies } from 'next/headers'
import type { UserWithoutPassword } from '@/types'
import { sessionOptions } from './session-config'

declare module 'iron-session' {
  interface IronSessionData {
    user?: UserWithoutPassword
  }
}

export const getSession = async (): Promise<IronSessionData> => {
  const cookieStore = await cookies()
  return await getIronSession(cookieStore, sessionOptions)
}

export const createSession = async (user: UserWithoutPassword): Promise<void> => {
  const session = await getSession()
  session.user = user
  await session.save()
}

export const destroySession = async (): Promise<void> => {
  const session = await getSession()
  await session.destroy()
}

export const getCurrentUser = async (): Promise<UserWithoutPassword | null> => {
  const session = await getSession()
  return session.user ?? null
}
