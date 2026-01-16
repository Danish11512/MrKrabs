import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { getCurrentUser } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/auth/LogoutButton'

export const Header = async (): Promise<React.JSX.Element> => {
  const user = await getCurrentUser()

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center justify-between px-8">
        <Link href="/" className="text-xl font-bold">
          Mr.Krabs
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
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
      </div>
    </header>
  )
}
