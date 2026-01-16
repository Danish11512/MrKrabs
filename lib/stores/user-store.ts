import { create } from 'zustand'
import type { UserWithoutPassword } from '@/types'

interface UserState {
  user: UserWithoutPassword | null
  isLoading: boolean
  error: string | null
  setUser: (user: UserWithoutPassword | null) => void
  clearUser: () => void
  updateUser: (updates: Partial<UserWithoutPassword>) => void
  hydrate: () => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user: UserWithoutPassword | null): void => {
    set({ user, error: null })
  },

  clearUser: (): void => {
    set({ user: null, error: null })
  },

  updateUser: (updates: Partial<UserWithoutPassword>): void => {
    const currentUser = get().user
    if (currentUser) {
      set({ user: { ...currentUser, ...updates } })
    }
  },

  hydrate: async (): Promise<void> => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/auth/session')
      if (!response.ok) {
        throw new Error('Failed to fetch session')
      }
      const data = await response.json()
      set({ user: data.user, isLoading: false, error: null })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to hydrate user store'
      set({ user: null, isLoading: false, error: errorMessage })
    }
  },
}))
