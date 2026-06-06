import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useReviewStore } from '@/store';
import { USE_MOCK_DATA, MOCK_REVIEWS } from '@/lib/mockData';
import type { DBReview, ReviewStatus } from '@/lib/supabase';

const PAGE_SIZE = 20;

export interface InfiniteReviewsReturn {
  reviews: DBReview[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  reset: () => void;
}

function applyMockFilters(
  pool: DBReview[],
  opts: {
    platform: string;
    rating: number | null;
    status: string;
    search: string;
    sortBy: string;
    sortOrder: string;
  }
): DBReview[] {
  let result = [...pool];
  const { platform, rating, status, search, sortBy, sortOrder } = opts;

  if (platform !== 'all') result = result.filter(r => r.platform === platform);
  if (rating   !== null)  result = result.filter(r => r.rating   === rating);
  if (status   !== 'all') result = result.filter(r => r.status   === (status as ReviewStatus));

  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      r => r.review_text.toLowerCase().includes(q) ||
           (r.reviewer_name ?? '').toLowerCase().includes(q)
    );
  }

  if (sortBy === 'rating') {
    result.sort((a, b) => sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating);
  } else if (sortBy === 'review_date') {
    result.sort((a, b) => sortOrder === 'asc'
      ? new Date(a.review_date).getTime() - new Date(b.review_date).getTime()
      : new Date(b.review_date).getTime() - new Date(a.review_date).getTime()
    );
  } else {
    result.sort((a, b) => sortOrder === 'asc'
      ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return result;
}

export function useInfiniteReviews(): InfiniteReviewsReturn {
  const filters = useReviewStore(s => s.filters);
  const { platform, rating, status, search, sortBy, sortOrder } = filters;

  // In mock mode, compute filtered reviews synchronously on every filter change.
  // All hooks must still be called before any conditional return.
  const mockFiltered = useMemo(() => {
    if (!USE_MOCK_DATA) return [];
    return applyMockFilters(MOCK_REVIEWS, { platform, rating, status, search, sortBy, sortOrder });
  }, [platform, rating, status, search, sortBy, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Real-data state (unused in mock mode) ───────────────── */
  const [realReviews, setRealReviews] = useState<DBReview[]>([]);
  const [hasMore,      setHasMore]     = useState(true);
  const [isLoadingMore, setLoading]   = useState(false);

  const lockRef    = useRef(false);
  const hasMoreRef = useRef(true);
  const cursorRef  = useRef<string | null>(null);

  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  /* Reset real-data state when filters change (real mode only) */
  useEffect(() => {
    if (USE_MOCK_DATA) return;
    setRealReviews([]);
    setHasMore(true);
    hasMoreRef.current = true;
    cursorRef.current  = null;
    lockRef.current    = false;
  }, [platform, rating, status, search, sortBy, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(async () => {
    // Mock data is provided by useMemo — nothing to load.
    if (USE_MOCK_DATA) return;

    if (lockRef.current || !hasMoreRef.current) return;
    lockRef.current = true;
    setLoading(true);

    try {
      let q = supabase
        .from('reviews')
        .select('*')
        .order(sortBy === 'rating' ? 'rating' : 'created_at', {
          ascending: sortOrder === 'asc',
        })
        .limit(PAGE_SIZE);

      if (cursorRef.current) q = q.lt('created_at', cursorRef.current);
      if (platform !== 'all') q = q.eq('platform', platform);
      if (rating   !== null)  q = q.eq('rating',   rating);
      if (status   !== 'all') q = q.eq('status',   status as ReviewStatus);

      const { data, error } = await q;

      if (error || !data) {
        setHasMore(false);
        hasMoreRef.current = false;
        return;
      }

      const rows = data as DBReview[];
      if (rows.length > 0) cursorRef.current = rows[rows.length - 1].created_at;

      const next = rows.length === PAGE_SIZE;
      setHasMore(next);
      hasMoreRef.current = next;

      setRealReviews(prev => {
        const seen = new Set(prev.map(r => r.id));
        return [...prev, ...(data as DBReview[]).filter(r => !seen.has(r.id))];
      });
    } finally {
      lockRef.current = false;
      setLoading(false);
    }
  }, [platform, rating, status, search, sortBy, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = useCallback(() => {
    if (USE_MOCK_DATA) return; // mock data is always fresh from useMemo
    setRealReviews([]);
    setHasMore(true);
    hasMoreRef.current = true;
    cursorRef.current  = null;
    lockRef.current    = false;
  }, []);

  if (USE_MOCK_DATA) {
    return {
      reviews:       mockFiltered,
      hasMore:       false,
      isLoadingMore: false,
      loadMore,
      reset,
    };
  }

  return { reviews: realReviews, hasMore, isLoadingMore, loadMore, reset };
}

export default useInfiniteReviews;
