import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useReviewStore } from '@/store';
import { useInfiniteReviews } from '@/hooks/useInfiniteReviews';
import { useDebounce } from '@/hooks/useDebounce';
import type { DBReview, ReviewStatus } from '@/lib/supabase';
import { FilterBar } from '@/components/review/FilterBar';
import { ReviewRow } from '@/components/review/ReviewRow';
import { Shimmer } from '@/components/ui/Shimmer';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

// ── sort options ──────────────────────────────────────────────

type SortKey = 'recent' | 'lowest' | 'oldest';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Most recent'     },
  { key: 'lowest', label: 'Lowest rated'    },
  { key: 'oldest', label: 'Awaiting longest'},
];

const SORT_MAP: Record<SortKey, { sortBy: 'created_at' | 'review_date' | 'rating'; sortOrder: 'asc' | 'desc' }> = {
  recent: { sortBy: 'created_at',  sortOrder: 'desc' },
  lowest: { sortBy: 'rating',      sortOrder: 'asc'  },
  oldest: { sortBy: 'review_date', sortOrder: 'asc'  },
};

// ── loading skeleton ──────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          12,
            padding:      '12px 16px',
            background:   'var(--bg-elevated)',
            border:       '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <Shimmer width={36} height={36} borderRadius="50%" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Shimmer width="40%"  height={13} />
            <Shimmer width="75%"  height={12} />
            <Shimmer width="30%"  height={11} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <Shimmer width={56} height={20} borderRadius="999px" />
            <Shimmer width={28} height={11} />
          </div>
        </div>
      ))}
    </>
  );
}

// ── main page ─────────────────────────────────────────────────

export function ReviewQueue() {
  const navigate       = useNavigate();
  const filters        = useReviewStore((s) => s.filters);
  const setFilters     = useReviewStore((s) => s.setFilters);
  const updateStatus   = useReviewStore((s) => s.updateReviewStatus);
  const storeIsLoading = useReviewStore((s) => s.isLoading);
  const total          = useReviewStore((s) => s.total);

  /* Infinite scroll */
  const { reviews, hasMore, isLoadingMore, loadMore, reset } = useInfiniteReviews();

  /* Bulk selection */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  /* Active sort key (local — maps to store fields) */
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  /* Search debounce */
  const debouncedSearch = useDebounce(filters.search, 300);
  const prevSearch      = useRef(filters.search);

  /* Sentinel ref for IntersectionObserver */
  const sentinelRef = useRef<HTMLDivElement>(null);

  /* ── Initial load & filter-driven reload ────────────────── */
  useEffect(() => {
    reset();
    void loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.platform,
    filters.rating,
    filters.status,
    filters.sortBy,
    filters.sortOrder,
  ]);

  /* React to debounced search changes */
  useEffect(() => {
    if (debouncedSearch === prevSearch.current) return;
    prevSearch.current = debouncedSearch;
    reset();
    void loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  /* ── IntersectionObserver for infinite scroll ────────────── */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          void loadMore();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  /* ── Sort ────────────────────────────────────────────────── */
  const handleSort = (key: SortKey) => {
    setSortKey(key);
    setFilters(SORT_MAP[key]);
  };

  /* ── Selection ───────────────────────────────────────────── */
  const toggleSelect = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const clearSelection = () => setSelected(new Set());

  /* ── Bulk actions ────────────────────────────────────────── */
  const bulkUpdate = useCallback(async (status: ReviewStatus) => {
    setBulkBusy(true);
    await Promise.all([...selected].map((id) => updateStatus(id, status)));
    setBulkBusy(false);
    clearSelection();
  }, [selected, updateStatus]);

  /* ── Row click: navigate to editor ──────────────────────── */
  const handleRowClick = useCallback((review: DBReview) => {
    navigate(`/editor/${review.id}`);
  }, [navigate]);

  const isEmpty    = reviews.length === 0 && !storeIsLoading && !isLoadingMore;
  const isInitialLoad = reviews.length === 0 && (storeIsLoading || isLoadingMore);

  return (
    <div
      style={{
        minHeight:       '100vh',
        background:      'var(--bg-primary)',
        display:         'flex',
        flexDirection:   'column',
      }}
    >
      {/* ── Page header ──────────────────────────────────── */}
      <div
        style={{
          padding:      '28px 32px 0',
          display:      'flex',
          flexDirection:'column',
          gap:          16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1
            style={{
              fontSize:      '22px',
              fontWeight:    700,
              color:         'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight:    1.2,
              margin:        0,
            }}
          >
            Review Queue
          </h1>
          {total > 0 && (
            <Badge variant="default" size="sm">
              {total.toLocaleString()} review{total !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* ── Bulk action bar ─────────────────────────────── */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y:  0  }}
              exit={{    opacity: 0, y: -6  }}
              transition={{ duration: 0.15 }}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          10,
                padding:      '10px 14px',
                background:   'var(--bg-elevated)',
                border:       '1px solid var(--accent-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span
                style={{
                  fontSize:   '13px',
                  fontWeight: 500,
                  color:      'var(--accent-primary)',
                  flexShrink: 0,
                }}
              >
                {selected.size} selected
              </span>

              <div
                style={{
                  width:      1,
                  height:     16,
                  background: 'var(--border-default)',
                  flexShrink: 0,
                }}
              />

              <Button
                variant="secondary"
                size="sm"
                loading={bulkBusy}
                onClick={() => void bulkUpdate('posted')}
              >
                Approve all
              </Button>

              <Button
                variant="ghost"
                size="sm"
                loading={bulkBusy}
                onClick={() => void bulkUpdate('ignored')}
              >
                Skip all
              </Button>

              <button
                onClick={clearSelection}
                style={{
                  marginLeft:  'auto',
                  background:  'transparent',
                  border:      'none',
                  color:       'var(--text-tertiary)',
                  cursor:      'pointer',
                  fontSize:    '13px',
                  fontFamily:  'inherit',
                  padding:     '2px 4px',
                  transition:  'color var(--transition-base)',
                }}
              >
                Clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Filter bar ──────────────────────────────────── */}
        <div
          style={{
            padding:      '16px',
            background:   'var(--bg-surface)',
            border:       '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <FilterBar />
        </div>

        {/* ── Sort controls ───────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          <span
            style={{
              fontSize:  '12px',
              color:     'var(--text-tertiary)',
              marginRight: 4,
            }}
          >
            Sort:
          </span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleSort(opt.key)}
              style={{
                padding:     '4px 10px',
                borderRadius:'var(--radius-sm)',
                fontSize:    '12px',
                fontWeight:  sortKey === opt.key ? 600 : 400,
                color:       sortKey === opt.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                background:  sortKey === opt.key ? 'var(--accent-muted)'  : 'transparent',
                border:      `1px solid ${sortKey === opt.key ? 'var(--accent-border)' : 'transparent'}`,
                cursor:      'pointer',
                fontFamily:  'inherit',
                transition:  'all var(--transition-base)',
                whiteSpace:  'nowrap',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Review list ──────────────────────────────────── */}
      <div
        style={{
          padding:       '16px 32px 32px',
          display:       'flex',
          flexDirection: 'column',
          gap:           8,
          flex:          1,
        }}
      >
        {/* Initial skeleton */}
        {isInitialLoad && <SkeletonRows />}

        {/* Reviews */}
        {!isInitialLoad && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden:  {},
              visible: { transition: { staggerChildren: 0.04 } },
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {reviews.map((review, idx) => (
              <ReviewRow
                key={review.id}
                review={review}
                index={idx}
                selected={selected.has(review.id)}
                onSelect={toggleSelect}
                onClick={handleRowClick}
              />
            ))}
          </motion.div>
        )}

        {/* Load-more shimmer rows */}
        {isLoadingMore && !isInitialLoad && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <SkeletonRows />
          </div>
        )}

        {/* IntersectionObserver sentinel */}
        <div ref={sentinelRef} style={{ height: 1 }} />

        {/* Empty state */}
        {isEmpty && (
          <EmptyState
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
            title="No reviews match your filters"
            description="Try adjusting the platform, rating, or status filters to find what you're looking for."
            action={{
              label:   'Clear filters',
              onClick: () => useReviewStore.getState().resetFilters(),
              variant: 'secondary',
            }}
          />
        )}

        {/* All loaded */}
        {!hasMore && reviews.length > 0 && !isLoadingMore && (
          <div
            style={{
              textAlign:  'center',
              padding:    '16px 0',
              fontSize:   '12px',
              color:      'var(--text-tertiary)',
            }}
          >
            All {reviews.length} review{reviews.length !== 1 ? 's' : ''} loaded
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewQueue;
