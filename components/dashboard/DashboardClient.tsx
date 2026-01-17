'use client'

import { Plus } from 'lucide-react'
import { noCompactor } from 'react-grid-layout'
import GridLayout from 'react-grid-layout'
import { useUserStore } from '@/lib/stores/user-store'
import { Button } from '@/components/ui/button'
import { GridItem } from '@/components/dashboard/GridItem'
import { GRID_COLS, GRID_ROWS, ROW_HEIGHT } from '@/lib/constants/dashboard.constants'
import { useContainerWidth } from '@/lib/hooks/use-container-width'
import { useUserHydration } from '@/lib/hooks/use-user-hydration'
import { useGridLayout } from '@/lib/hooks/use-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

export const DashboardClient = (): React.JSX.Element => {
  const { user, isLoading, error } = useUserStore()
  const containerWidth = useContainerWidth()
  const { layout, addGridItem, updateItemLock, setLayout } = useGridLayout()

  useUserHydration()

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
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50"
        onClick={addGridItem}
        aria-label="Add new grid item"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <GridLayout
        className="layout"
        layout={layout}
        width={containerWidth}
        gridConfig={{
          cols: GRID_COLS,
          rowHeight: ROW_HEIGHT,
          maxRows: GRID_ROWS,
        }}
        dragConfig={{
          enabled: true,
        }}
        // Note: Static items (locked) automatically prevent collision - other items cannot overlap them
        resizeConfig={{
          enabled: false, // Start with resize disabled, enable per-item later
        }}
        compactor={noCompactor} // No auto-compaction (items stay at fixed positions)
        onLayoutChange={(newLayout) => setLayout(newLayout)}
      >
        {layout.map((item) => (
          <div key={item.i}>
            <GridItem
              id={item.i}
              w={item.w}
              h={item.h}
              isLocked={item.static ?? false}
              onLockChange={(locked) => {
                updateItemLock(item.i, locked)
              }}
            >
              <p className="text-muted-foreground">New Item</p>
            </GridItem>
          </div>
        ))}
      </GridLayout>
    </div>
  )
}
