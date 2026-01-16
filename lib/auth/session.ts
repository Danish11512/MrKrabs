import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import type { UserWithoutPassword } from '@/types'
import { sessionOptions } from './session-config'

declare module 'iron-session' {
  interface IronSessionData {
    user?: UserWithoutPassword
  }
}

type Session = {
  user?: UserWithoutPassword
  save: () => Promise<void>
  destroy: () => Promise<void>
}

export const getSession = async (): Promise<Session> => {
  const cookieStore = await cookies()
  return await getIronSession(cookieStore, sessionOptions) as Session
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
