// Dashboard-related types and interfaces

export interface GridItemProps {
  children: React.ReactNode
  w: number // Width in grid units
  h: number // Height in grid units
  id: string // Unique identifier for react-grid-layout
  isLocked?: boolean // Optional initial lock state
  onLockChange?: (isLocked: boolean) => void // Callback when lock state changes
  className?: string // Additional CSS classes
}
