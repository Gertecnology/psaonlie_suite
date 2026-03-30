import { useEffect, useRef, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void | Promise<void>
  threshold?: number
}

export function useInfiniteScroll({
  isLoading,
  hasMore,
  onLoadMore,
  threshold = 100,
}: UseInfiniteScrollOptions) {
  const elementRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    if (!elementRef.current || isLoading || !hasMore) return

    const { scrollTop, scrollHeight, clientHeight } = elementRef.current
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

    if (distanceFromBottom < threshold) {
      onLoadMore()
    }
  }, [isLoading, hasMore, onLoadMore, threshold])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('scroll', handleScroll)
    return () => element.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return elementRef
}
