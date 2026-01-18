// Dashboard-related types and interfaces

export type GridItemType = 'account_balance' | 'transaction_list' | 'note'

export interface GridItemContent {
  // For account_balance and transaction_list
  accountId?: string
  // For transaction_list
  limit?: number
  // For note
  note?: string
}

export interface GridItemProps {
  children?: React.ReactNode
  w: number // Width in grid units
  h: number // Height in grid units
  id: string // Unique identifier for react-grid-layout
  isLocked?: boolean // Optional initial lock state
  onLockChange?: (isLocked: boolean) => void // Callback when lock state changes
  className?: string // Additional CSS classes
  itemType?: GridItemType // Type of grid item
  content?: GridItemContent // Configuration/references, not actual data values
}

export interface DashboardGridItem {
  itemId: string
  layoutId: string
  itemKey: string
  x: number
  y: number
  w: number
  h: number
  static: boolean
  itemType: GridItemType
  content: GridItemContent
  createdAt: Date
  updatedAt: Date
}

export interface DashboardLayout {
  layoutId: string
  userId: string
  createdAt: Date
  updatedAt: Date
  items: DashboardGridItem[]
}

export interface GridItemData {
  itemKey: string
  x: number
  y: number
  w: number
  h: number
  static: boolean
  itemType: GridItemType
  content: GridItemContent
}
