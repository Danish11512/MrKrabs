import { useEffect, useState } from 'react'
import { INITIAL_CONTAINER_WIDTH } from '@/lib/constants/dashboard.constants'

export const useContainerWidth = (): number => {
  const [containerWidth, setContainerWidth] = useState<number>(INITIAL_CONTAINER_WIDTH)

  useEffect(() => {
    // Initialize width on mount (with SSR check)
    if (typeof window !== 'undefined') {
      setContainerWidth(window.innerWidth)
    }

    // Handle window resize
    const handleResize = (): void => {
      setContainerWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return containerWidth
}
