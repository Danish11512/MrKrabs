'use client'

import { useState, useEffect } from 'react'
import { Lock, Unlock } from 'lucide-react'
import type { GridItemProps } from '@/types/dashboard.type'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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
        'group backdrop-blur-xl backdrop-saturate-150 bg-[oklch(0.85_0_0/0.25)] dark:bg-[oklch(0.4_0_0/0.3)] text-card-foreground flex flex-col rounded-xl border border-[var(--glass-border-light)] dark:border-[var(--glass-border-dark)] p-6 shadow-lg dark:shadow-[var(--shadow-dark)] h-full w-full relative',
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={toggleLock}
        aria-label={isLocked ? 'Unlock item' : 'Lock item'}
      >
        {isLocked ? (
          <Lock className="h-4 w-4" />
        ) : (
          <Unlock className="h-4 w-4" />
        )}
      </Button>
      {children}
    </div>
  )
}
