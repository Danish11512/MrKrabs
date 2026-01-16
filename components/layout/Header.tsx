import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { getCurrentUser } from '@/lib/auth/session'
import { HeaderNav } from './HeaderNav'

export const Header = async (): Promise<React.JSX.Element> => {
  const user = await getCurrentUser()

  return (
    <header className="backdrop-blur-xl backdrop-saturate-150 border-b border-[var(--glass-border-light)] dark:border-[var(--glass-border-dark)] bg-[var(--glass-bg-light)] dark:bg-[var(--glass-bg-dark)] shadow-lg dark:shadow-[var(--shadow-dark)] rounded-b-xl">
      <div className="flex h-16 items-center justify-between px-8">
        <Link href="/" className="text-xl font-bold">
          Mr.Krabs
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <HeaderNav user={user} />
        </div>
      </div>
    </header>
  )
}
