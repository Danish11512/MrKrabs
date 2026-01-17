'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface GridItemProps {
  children: React.ReactNode
  w: number // Width in grid units
  h: number // Height in grid units
  id: string // Unique identifier for react-grid-layout
  isLocked?: boolean // Optional initial lock state
  onLockChange?: (isLocked: boolean) => void // Callback when lock state changes
  className?: string // Additional CSS classes
}

export const GridItem = ({
  children,
  w,
  h,
  id,
  isLocked: initialIsLocked = false,
  onLockChange,
  className,
}: GridItemProps): React.JSX.Element => {
  const [isLocked, setIsLocked] = useState<boolean>(initialIsLocked)

  // Sync internal state with external prop changes
  useEffect(() => {
    setIsLocked(initialIsLocked)
  }, [initialIsLocked])

  const toggleLock = (): void => {
    const newState = !isLocked
    setIsLocked(newState)
    onLockChange?.(newState)
  }

  return (
    <div
      data-grid-item-id={id}
      data-grid-item-width={w}
      data-grid-item-height={h}
      data-grid-item-locked={isLocked}
      className={cn(
        'backdrop-blur-xl backdrop-saturate-150 bg-[var(--glass-bg-light)] dark:bg-[var(--glass-bg-dark)] text-card-foreground flex flex-col rounded-xl border border-[var(--glass-border-light)] dark:border-[var(--glass-border-dark)] p-6 shadow-lg dark:shadow-[var(--shadow-dark)] h-full w-full',
        className
      )}
    >
      {children}
    </div>
  )
}
