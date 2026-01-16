'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/lib/stores/user-store'

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'destructive' | 'ghost' | 'link'
}

export const LogoutButton = ({ variant = 'outline' }: LogoutButtonProps): React.JSX.Element => {
  const router = useRouter()
  const clearUser = useUserStore((state) => state.clearUser)

  const handleLogout = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        // Clear Zustand store
        clearUser()
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <Button type="button" variant={variant} onClick={handleLogout}>
      Logout
    </Button>
  )
}
