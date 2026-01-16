'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'destructive' | 'ghost' | 'link'
}

export const LogoutButton = ({ variant = 'outline' }: LogoutButtonProps): JSX.Element => {
  const router = useRouter()

  const handleLogout = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
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
