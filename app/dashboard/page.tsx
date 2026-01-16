import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

const DashboardPage = async (): Promise<React.JSX.Element> => {
  // Server-side auth check - redirect if not authenticated
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Client component handles Zustand store hydration and rendering
  return <DashboardClient />
}

export default DashboardPage
