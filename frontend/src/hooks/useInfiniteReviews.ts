import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useReviewStore } from '@/store';
import { USE_MOCK_DATA, MOCK_REVIEWS } from '@/lib/mockData';
import type { DBReview } from '@/lib/supabase';

const PAGE_SIZE = 20;

export interface InfiniteReviewsReturn {
  reviews: DBReview[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  reset: () => void;
}

export function useInfiniteReviews(): InfiniteReviewsReturn {
  const filters = useReviewStore((s) => s.filters);

  const [reviews, setReviews]         = useState<DBReview[]>([]);
  const [hasMore, setHasMore]         = useState(true);
  const [isLoadingMore, setLoading]   = useState(false);

  /* Refs used inside callbacks to avoid stale closures */
  const lockRef       = useRef(false);
  const hasMoreRef    = useRef(true);
  const cursorRef     = useRef<string | null>(null);

  /* Sync refs with state */
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  /* Reset accumulated list whenever filters change */
  const { platform, rating, status, search, sortBy, sortOrder } = filters;
  useEffect(() => {
    setReviews([]);
    setHasMore(true);
    hasMoreRef.current = true;
    cursorRef.current  = null;
    lockRef.current    = false;
  }, [platform, rating, status, search, sortBy, sortOrder]);

  const loadMore = useCallback(async () => {
    if (lockRef.current || !hasMoreRef.current) return;
    lockRef.current = true;
    setLoading(true);

    try {
      if (USE_MOCK_DATA) {
        /* ── Mock: filter + slice ────────────────────────────── */
        let pool = [...MOCK_REVIEWS];
        if (platform !== 'all') pool = pool.filter((r) => r.platform === platform);
        if (rating   !== null)  pool = pool.filter((r) => r.rating   === rating);
        if (status   !== 'all') pool = pool.filter((r) => r.status   === status);
        if (search.trim()) {
          const q = search.toLowerCase();
          pool = pool.filter(
            (r) =>
              r.review_text.toLowerCase().includes(q) ||
              (r.reviewer_name ?? '').toLowerCase().includes(q),
          );
        }

        /* cursor = index into pool (stored as string offset) */
        const offset = cursorRef.current ? parseInt(cursorRef.current, 10) : 0;
        const page   = pool.slice(offset, offset + PAGE_SIZE);
        const nextOffset = offset + page.length;

        setReviews((prev) => {
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...page.filter((r) => !seen.has(r.id))];
        });
        setHasMore(nextOffset < pool.length);
        hasMoreRef.current = nextOffset < pool.length;
        cursorRef.current  = String(nextOffset);
      } else {
        /* ── Real Supabase cursor pagination ─────────────────── */
        let q = supabase
          .from('reviews')
          .select('*')
          .order(sortBy === 'rating' ? 'rating' : 'created_at', {
            ascending: sortOrder === 'asc',
          })
          .limit(PAGE_SIZE);

        if (cursorRef.current) {
          /* Use created_at as cursor for recency sort, id for others */
          q = q.lt('created_at', cursorRef.current);
        }
        if (platform !== 'all') q = q.eq('platform', platform);
        if (rating   !== null)  q = q.eq('rating',   rating);
        if (status   !== 'all') q = q.eq('status',   status);

        const { data, error } = await q;

        if (error || !data) {
          setHasMore(false);
          hasMoreRef.current = false;
          return;
        }

        if (data.length > 0) {
          cursorRef.current = data[data.length - 1].created_at;
        }

        const next = data.length === PAGE_SIZE;
        setHasMore(next);
        hasMoreRef.current = next;

        setReviews((prev) => {
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...(data as DBReview[]).filter((r) => !seen.has(r.id))];
        });
      }
    } finally {
      lockRef.current = false;
      setLoading(false);
    }
  }, [platform, rating, status, search, sortBy, sortOrder]);

  const reset = useCallback(() => {
    setReviews([]);
    setHasMore(true);
    hasMoreRef.current = true;
    cursorRef.current  = null;
    lockRef.current    = false;
  }, []);

  return { reviews, hasMore, isLoadingMore, loadMore, reset };
}

export default useInfiniteReviews;
