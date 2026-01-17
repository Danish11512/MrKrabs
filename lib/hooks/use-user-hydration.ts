import { useEffect } from 'react'
import { useUserStore } from '@/lib/stores/user-store'

export const useUserHydration = (): void => {
  const { user, isLoading, hydrate } = useUserStore()

  useEffect(() => {
    // Hydrate store on mount if user is not already loaded
    if (!user && !isLoading) {
      hydrate()
    }
  }, [user, isLoading, hydrate])
}
