import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
}

export const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 100,
}: UseInfiniteScrollOptions) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  // Cooldown flag — after firing, ignore the observer for 800 ms so a single
  // scroll event cannot enqueue multiple page fetches
  const cooldownRef = useRef(false);

  const setLoadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoading && !cooldownRef.current) {
            cooldownRef.current = true;
            onLoadMore();
            setTimeout(() => { cooldownRef.current = false; }, 800);
          }
        },
        { rootMargin: `${threshold}px` }
      );

      observerRef.current.observe(node);
      loadMoreRef.current = node;
    },
    [isLoading, hasMore, onLoadMore, threshold]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { loadMoreRef: setLoadMoreRef };
};

export default useInfiniteScroll;
