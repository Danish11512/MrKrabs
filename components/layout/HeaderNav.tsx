'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/auth/LogoutButton'
import type { UserWithoutPassword } from '@/types'

interface HeaderNavProps {
  user: UserWithoutPassword | null
}

export const HeaderNav = ({ user }: HeaderNavProps): React.JSX.Element => {
  const pathname = usePathname()
  const isDashboard = pathname === '/dashboard'

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <>
          {!isDashboard && (
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          )}
          <LogoutButton />
        </>
      ) : (
        <>
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign Up</Button>
          </Link>
        </>
      )}
    </div>
  )
}
