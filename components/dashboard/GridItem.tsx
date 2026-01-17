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
        'group backdrop-blur-xl backdrop-saturate-150 backdrop-brightness-110 backdrop-contrast-125',
        'bg-[oklch(0.85_0_0/0.12)] dark:bg-[oklch(0.4_0_0/0.15)]',
        'text-card-foreground flex flex-col rounded-xl',
        'border border-[var(--glass-border-light)] dark:border-[var(--glass-border-dark)]',
        'shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3),var(--shadow-dark)]',
        'before:content-[""] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-50 dark:before:from-white/5 before:pointer-events-none',
        'after:content-[""] after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-tr after:from-transparent after:to-black/5 dark:after:to-transparent after:pointer-events-none',
        'p-6 h-full w-full relative overflow-hidden',
        'transition-all duration-300 ease-out',
        'hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.15)] dark:hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.4),var(--shadow-dark)]',
        'hover:backdrop-blur-2xl hover:backdrop-saturate-200',
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
