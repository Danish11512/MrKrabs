import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
        <Link href="/" className="text-xl font-bold">
          Financial Dashboard
        </Link>
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/transactions"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Transactions
            </Link>
            <Link
              href="/budget"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Budget
            </Link>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
