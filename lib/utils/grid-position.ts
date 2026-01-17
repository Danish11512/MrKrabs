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
