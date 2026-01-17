'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/lib/stores/user-store'
import GridLayout, { type Layout, type LayoutItem, noCompactor } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

export const DashboardClient = (): React.JSX.Element => {
  const { user, isLoading, error, hydrate } = useUserStore()
  const [layout, setLayout] = useState<Layout>([])

  const GRID_COLS = 12
  const GRID_ROWS = 60
  const ROW_HEIGHT = 20 // pixels per row (60 rows × 20px = 1200px total)

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
    <div className="min-h-screen bg-background p-4">
      <GridLayout
        className="layout"
        layout={layout}
        width={1200} // Initial width, will be responsive
        gridConfig={{
          cols: GRID_COLS,
          rowHeight: ROW_HEIGHT,
          maxRows: GRID_ROWS,
        }}
        dragConfig={{
          enabled: true,
        }}
        resizeConfig={{
          enabled: false, // Start with resize disabled, enable per-item later
        }}
        compactor={noCompactor} // No auto-compaction (items stay at fixed positions)
        onLayoutChange={(newLayout) => setLayout(newLayout)}
      >
        {null}
      </GridLayout>
    </div>
  )
}
