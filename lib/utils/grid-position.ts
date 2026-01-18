import type { Layout, LayoutItem } from 'react-grid-layout'

const hasCollision = (
  existingItem: LayoutItem,
  newX: number,
  newY: number,
  newW: number,
  newH: number
): boolean => {
  // Collision check: items overlap if rectangles intersect
  return (
    existingItem.x < newX + newW &&
    existingItem.x + existingItem.w > newX &&
    existingItem.y < newY + newH &&
    existingItem.y + existingItem.h > newY
  )
}

export const validateLayout = (
  layout: Layout,
  cols: number,
  maxRows: number
): Layout => {
  // Remove overlaps by keeping static items and resolving conflicts for non-static items
  const validated: LayoutItem[] = []
  const processed = new Set<string>()

  // First, add all static items (they have priority and can't be moved)
  for (const item of layout) {
    if (item.static) {
      validated.push(item)
      processed.add(item.i)
    }
  }

  // Then process non-static items, preserving order to maintain drag behavior
  for (const item of layout) {
    // Skip if item is already processed (static items)
    if (processed.has(item.i)) {
      continue
    }

    // Check for overlaps with already validated items (including static)
    const overlappingItem = validated.find((existingItem) =>
      hasCollision(existingItem, item.x, item.y, item.w, item.h)
    )

    if (overlappingItem) {
      // If overlapping with a static item, must move this item
      if (overlappingItem.static) {
        const newPosition = calculateNextPosition(
          validated as Layout,
          cols,
          maxRows,
          item.w,
          item.h
        )
        if (newPosition) {
          validated.push({
            ...item,
            x: newPosition.x,
            y: newPosition.y,
          })
        }
        // If no position found, skip this item (grid is full)
      } else {
        // Both are non-static - keep the one that was processed first (earlier in array)
        // The later one needs to be repositioned
        const newPosition = calculateNextPosition(
          validated as Layout,
          cols,
          maxRows,
          item.w,
          item.h
        )
        if (newPosition) {
          validated.push({
            ...item,
            x: newPosition.x,
            y: newPosition.y,
          })
        }
        // If no position found, skip this item
      }
    } else {
      // No overlap, add item as-is
      validated.push(item)
    }

    processed.add(item.i)
  }

  return validated as Layout
}

export const calculateNextPosition = (
  layout: Layout,
  cols: number,
  maxRows: number,
  itemWidth: number,
  itemHeight: number
): { x: number; y: number } | null => {
  // Start at top-left (0, 0)
  // Iterate through rows from top to bottom
  for (let y = 0; y <= maxRows - itemHeight; y++) {
    // For each row, iterate through columns from left to right
    for (let x = 0; x <= cols - itemWidth; x++) {
      // Check if position can fit item (considering width and height)
      // Check for collisions with existing items
      const hasCollisionWithAny = layout.some((existingItem) =>
        hasCollision(existingItem, x, y, itemWidth, itemHeight)
      )

      if (!hasCollisionWithAny) {
        // Return first valid position
        return { x, y }
      }
    }
  }

  // Grid is completely full
  return null
}
