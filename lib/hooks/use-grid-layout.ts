import { useState, useEffect, useCallback, useRef } from 'react'
import type { Layout, LayoutItem } from 'react-grid-layout'
import { calculateNextPosition } from '@/lib/utils/grid-position'
import {
  GRID_COLS,
  GRID_ROWS,
  DEFAULT_ITEM_WIDTH,
  DEFAULT_ITEM_HEIGHT,
} from '@/lib/constants/dashboard.constants'
import { debounce } from '@/lib/utils/debounce'
import type { GridItemType, GridItemContent, DashboardGridItem } from '@/types/dashboard.type'

interface ItemMetadata {
  itemType: GridItemType
  content: GridItemContent
}

interface ItemMetadata {
  itemType: GridItemType
  content: GridItemContent
}

interface UseGridLayoutReturn {
  layout: Layout
  itemMetadata: Map<string, ItemMetadata>
  isLoading: boolean
  error: string | null
  addGridItem: (itemType?: GridItemType, content?: GridItemContent) => void
  updateItemLock: (itemId: string, isLocked: boolean) => void
  updateItemType: (itemId: string, itemType: GridItemType) => void
  updateItemContent: (itemId: string, content: GridItemContent) => void
  setLayout: (layout: Layout) => void
  loadLayout: () => Promise<void>
}

export const useGridLayout = (): UseGridLayoutReturn => {
  const [layout, setLayout] = useState<Layout>([])
  const [itemMetadata, setItemMetadata] = useState<Map<string, ItemMetadata>>(new Map())
  const [itemIdCounter, setItemIdCounter] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true)
  const itemIdCounterRef = useRef<number>(0)

  // Convert layout and metadata to API format
  const layoutToApiFormat = useCallback((currentLayout: Layout, currentMetadata: Map<string, ItemMetadata>) => {
    return currentLayout.map((item) => {
      const metadata = currentMetadata.get(item.i) || {
        itemType: 'note' as GridItemType,
        content: {} as GridItemContent,
      }
      return {
        itemKey: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        static: item.static ?? false,
        itemType: metadata.itemType,
        content: metadata.content,
      }
    })
  }, [])

  // Save layout to API
  const saveLayoutToApi = useCallback(async (currentLayout: Layout, currentMetadata: Map<string, ItemMetadata>) => {
    try {
      const items = layoutToApiFormat(currentLayout, currentMetadata)
      const response = await fetch('/api/dashboard/layout', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) {
        throw new Error('Failed to save layout')
      }
    } catch (err) {
      console.error('Error saving layout:', err)
      setError(err instanceof Error ? err.message : 'Failed to save layout')
    }
  }, [layoutToApiFormat])

  // Debounced save function
  const debouncedSave = useRef(
    debounce((currentLayout: Layout, currentMetadata: Map<string, ItemMetadata>) => {
      saveLayoutToApi(currentLayout, currentMetadata)
    }, 500)
  ).current

  // Load layout from API
  const loadLayout = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/dashboard/layout')

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          const errorText = await response.text().catch(() => 'Unable to read error')
          errorData = { error: errorText }
        }
        const errorMessage = errorData.details || errorData.error || `Failed to load layout: ${response.status} ${response.statusText}`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const items = (data.items || []) as DashboardGridItem[]

      if (items.length === 0) {
        setIsLoading(false)
        setIsInitialLoad(false)
        return
      }

      // Convert API format to react-grid-layout format
      const loadedLayout: Layout = items.map((item) => ({
        i: item.itemKey,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        static: item.static,
      }))

      // Store metadata
      const loadedMetadata = new Map<string, ItemMetadata>()
      items.forEach((item) => {
        loadedMetadata.set(item.itemKey, {
          itemType: item.itemType,
          content: item.content,
        })
      })

      // Find max item ID counter
      const maxId = items.reduce((max, item) => {
        const match = item.itemKey.match(/^grid-item-(\d+)$/)
        if (match) {
          const id = parseInt(match[1], 10)
          return Math.max(max, id)
        }
        return max
      }, -1)

      setLayout(loadedLayout)
      setItemMetadata(loadedMetadata)
      const nextCounter = maxId + 1
      setItemIdCounter(nextCounter)
      itemIdCounterRef.current = nextCounter
      setIsLoading(false)
      setIsInitialLoad(false)
    } catch (err) {
      console.error('Error loading layout:', err)
      setError(err instanceof Error ? err.message : 'Failed to load layout')
      setIsLoading(false)
      setIsInitialLoad(false)
    }
  }, [])

  // Load layout on mount
  useEffect(() => {
    if (isInitialLoad) {
      loadLayout()
    }
  }, [isInitialLoad, loadLayout])

  const addGridItem = useCallback((itemType: GridItemType = 'note', content: GridItemContent = {}) => {
    setLayout((prevLayout) => {
      const position = calculateNextPosition(
        prevLayout,
        GRID_COLS,
        GRID_ROWS,
        DEFAULT_ITEM_WIDTH,
        DEFAULT_ITEM_HEIGHT
      )

      if (!position) {
        // Grid is full - could show error message or prevent adding
        return prevLayout
      }

      const newId = `grid-item-${itemIdCounterRef.current}`
      const newItem: LayoutItem = {
        i: newId,
        x: position.x,
        y: position.y,
        w: DEFAULT_ITEM_WIDTH,
        h: DEFAULT_ITEM_HEIGHT,
        static: false,
      }

      const updatedLayout = [...prevLayout, newItem]

      setItemIdCounter((prevCounter) => {
        itemIdCounterRef.current = prevCounter + 1
        return prevCounter + 1
      })

      setItemMetadata((prevMetadata) => {
        const updatedMetadata = new Map(prevMetadata)
        updatedMetadata.set(newId, { itemType, content })
        // Trigger debounced save with updated values
        debouncedSave(updatedLayout, updatedMetadata)
        return updatedMetadata
      })

      return updatedLayout
    })
  }, [debouncedSave])

  const updateItemLock = useCallback((itemId: string, isLocked: boolean) => {
    setLayout((prev) => {
      const updated = prev.map((item) => (item.i === itemId ? { ...item, static: isLocked } : item))
      debouncedSave(updated, itemMetadata)
      return updated
    })
  }, [itemMetadata, debouncedSave])

  const updateItemType = useCallback((itemId: string, itemType: GridItemType) => {
    setItemMetadata((prev) => {
      const next = new Map(prev)
      const existing = next.get(itemId) || { itemType: 'note', content: {} }
      next.set(itemId, { ...existing, itemType })
      debouncedSave(layout, next)
      return next
    })
  }, [layout, debouncedSave])

  const updateItemContent = useCallback((itemId: string, content: GridItemContent) => {
    setItemMetadata((prev) => {
      const next = new Map(prev)
      const existing = next.get(itemId) || { itemType: 'note', content: {} }
      next.set(itemId, { ...existing, content })
      debouncedSave(layout, next)
      return next
    })
  }, [layout, debouncedSave])

  const handleSetLayout = useCallback((newLayout: Layout) => {
    setLayout(newLayout)
    debouncedSave(newLayout, itemMetadata)
  }, [itemMetadata, debouncedSave])

  return {
    layout,
    itemMetadata,
    isLoading,
    error,
    addGridItem,
    updateItemLock,
    updateItemType,
    updateItemContent,
    setLayout: handleSetLayout,
    loadLayout,
  }
}
