import Link from 'next/link'
import { Button } from '@/components/ui/button'

const Home = (): React.JSX.Element => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-6xl font-bold tracking-tight">Mr.Krabs</h1>
        </div>
        <div>
          <Link href="/login">
            <Button size="lg">Login</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home
