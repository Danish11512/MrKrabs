'use client'

import { Plus } from 'lucide-react'
import { noCompactor } from 'react-grid-layout'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { Button } from '@/components/ui/button'
import { GridItem } from '@/components/dashboard/GridItem'

import { GRID_COLS, GRID_ROWS, ROW_HEIGHT } from '@/lib/constants/dashboard.constants'
import { validateLayout } from '@/lib/utils/grid-position'
import { useContainerWidth } from '@/lib/hooks/use-container-width'
import { useUserHydration } from '@/lib/hooks/use-user-hydration'
import { useGridLayout } from '@/lib/hooks/use-grid-layout'
import { useUserStore } from '@/lib/stores/user-store'

export const DashboardClient = (): React.JSX.Element => {
  const { user, isLoading: userLoading, error: userError } = useUserStore()
  const containerWidth = useContainerWidth()
  const {
    layout,
    itemMetadata,
    isLoading: layoutLoading,
    error: layoutError,
    addGridItem,
    updateItemLock,
    setLayout,
  } = useGridLayout()

  useUserHydration()

  const isLoading = userLoading || layoutLoading
  const error = userError || layoutError

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
        onClick={() => addGridItem()}
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
        onLayoutChange={(newLayout) => {
          // Always validate layout to prevent overlaps - this runs during drag and on stop
          const validatedLayout = validateLayout(newLayout, GRID_COLS, GRID_ROWS)
          const validatedOverlaps = validatedLayout.filter((item, idx) => {
            return validatedLayout.some((other, otherIdx) => {
              if (idx === otherIdx) return false
              return item.x < other.x + other.w && item.x + item.w > other.x &&
                     item.y < other.y + other.h && item.y + item.h > other.y
            })
          })
          // Only update layout if validation removed overlaps or layout is valid
          if (validatedOverlaps.length === 0) {
            setLayout(validatedLayout)
          }
        }}
      >
        {layout.map((item) => {
          const metadata = itemMetadata.get(item.i)
          return (
            <div key={item.i}>
              <GridItem
                id={item.i}
                w={item.w}
                h={item.h}
                isLocked={item.static ?? false}
                onLockChange={(locked) => {
                  updateItemLock(item.i, locked)
                }}
                itemType={metadata?.itemType}
                content={metadata?.content}
              />
            </div>
          )
        })}
      </GridLayout>
    </div>
  )
}
