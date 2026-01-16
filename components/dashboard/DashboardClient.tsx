'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/lib/stores/user-store'

export const DashboardClient = (): React.JSX.Element => {
  const { user, isLoading, error, hydrate } = useUserStore()

  useEffect(() => {
    // Hydrate store on mount if user is not already loaded
    if (!user && !isLoading) {
      hydrate()
    }
  }, [user, isLoading, hydrate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-8 space-y-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-8 space-y-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-destructive">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-8 space-y-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">No user data available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {user.firstName} {user.lastName}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
