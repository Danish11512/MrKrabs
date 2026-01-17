import { useState } from 'react'
import type { Layout, LayoutItem } from 'react-grid-layout'
import { calculateNextPosition } from '@/lib/utils/grid-position'
import {
  GRID_COLS,
  GRID_ROWS,
  DEFAULT_ITEM_WIDTH,
  DEFAULT_ITEM_HEIGHT,
} from '@/lib/constants/dashboard.constants'

interface UseGridLayoutReturn {
  layout: Layout
  addGridItem: () => void
  updateItemLock: (itemId: string, isLocked: boolean) => void
  setLayout: (layout: Layout) => void
}

export const useGridLayout = (): UseGridLayoutReturn => {
  const [layout, setLayout] = useState<Layout>([])
  const [itemIdCounter, setItemIdCounter] = useState<number>(0)

  const addGridItem = (): void => {
    const position = calculateNextPosition(
      layout,
      GRID_COLS,
      GRID_ROWS,
      DEFAULT_ITEM_WIDTH,
      DEFAULT_ITEM_HEIGHT
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
      w: DEFAULT_ITEM_WIDTH,
      h: DEFAULT_ITEM_HEIGHT,
      static: false,
    }

    setLayout([...layout, newItem])
    setItemIdCounter(itemIdCounter + 1)
  }

  const updateItemLock = (itemId: string, isLocked: boolean): void => {
    setLayout(
      layout.map((item) => (item.i === itemId ? { ...item, static: isLocked } : item))
    )
  }

  return {
    layout,
    addGridItem,
    updateItemLock,
    setLayout,
  }
}
