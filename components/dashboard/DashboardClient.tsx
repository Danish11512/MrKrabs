'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useUserStore } from '@/lib/stores/user-store'
import GridLayout, { type Layout, type LayoutItem, noCompactor } from 'react-grid-layout'
import { Button } from '@/components/ui/button'
import { GridItem } from '@/components/dashboard/GridItem'
import { calculateNextPosition } from '@/lib/utils/grid-position'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

export const DashboardClient = (): React.JSX.Element => {
  const { user, isLoading, error, hydrate } = useUserStore()
  const [layout, setLayout] = useState<Layout>([])
  const [itemIdCounter, setItemIdCounter] = useState<number>(0)

  const GRID_COLS = 12
  const GRID_ROWS = 60
  const ROW_HEIGHT = 20 // pixels per row (60 rows × 20px = 1200px total)

  useEffect(() => {
    // Hydrate store on mount if user is not already loaded
    if (!user && !isLoading) {
      hydrate()
    }
  }, [user, isLoading, hydrate])

  const handleAddGridItem = (): void => {
    const DEFAULT_WIDTH = 4
    const DEFAULT_HEIGHT = 4

    const position = calculateNextPosition(
      layout,
      GRID_COLS,
      GRID_ROWS,
      DEFAULT_WIDTH,
      DEFAULT_HEIGHT
    )

    if (!position) {
      // Grid is full - could show error message or prevent adding
      return
    }

    const newId = `grid-item-${itemIdCounter}`
    const newItem: LayoutItem = {
      i: newId,
      x: position.x,
      y: position.y,
      w: DEFAULT_WIDTH,
      h: DEFAULT_HEIGHT,
      static: false,
    }

    setLayout([...layout, newItem])
    setItemIdCounter(itemIdCounter + 1)
  }

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
        onClick={handleAddGridItem}
        aria-label="Add new grid item"
      >
        <Plus className="h-4 w-4" />
      </Button>
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
        {layout.map((item) => (
          <div key={item.i}>
            <GridItem
              id={item.i}
              w={item.w}
              h={item.h}
              isLocked={item.static ?? false}
              onLockChange={(locked) => {
                setLayout(layout.map(l => 
                  l.i === item.i ? { ...l, static: locked } : l
                ))
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
