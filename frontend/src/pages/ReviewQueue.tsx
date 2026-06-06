import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockReviews } from '../lib/mockData';
import { useReviewStore } from '../store';
import { ReviewRow } from '../components/review/ReviewRow';
import type { DBReview, ReviewStatus } from '../lib/supabase';

const PLATFORMS = ['google', 'zomato', 'swiggy', 'tripadvisor'];
const PLATFORM_LABELS: Record<string, string> = {
  google: 'Google', zomato: 'Zomato', swiggy: 'Swiggy', tripadvisor: 'TripAdvisor',
};
const RATINGS  = [1, 2, 3, 4, 5];
const STATUSES: { key: ReviewStatus | 'all'; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'pending',  label: 'Pending'  },
  { key: 'draft',    label: 'Draft'    },
  { key: 'approved', label: 'Approved' },
  { key: 'posted',   label: 'Posted'   },
  { key: 'ignored',  label: 'Ignored'  },
];

function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding:      '4px 10px',
        borderRadius: '999px',
        fontSize:     '12px',
        fontWeight:   active ? 600 : 400,
        color:        active ? '#ff6b35' : 'var(--text-secondary)',
        background:   active ? 'rgba(255,107,53,0.12)' : 'var(--bg-elevated)',
        border:       `1px solid ${active ? 'rgba(255,107,53,0.3)' : 'var(--border-default)'}`,
        cursor:       'pointer',
        fontFamily:   'inherit',
        transition:   'all 150ms ease',
        whiteSpace:   'nowrap',
      }}
    >
      {children}
    </button>
  );
}

export function ReviewQueue() {
  const navigate       = useNavigate();
  const setCurrentReview = useReviewStore(s => s.setCurrentReview);

  const [reviews]           = useState<DBReview[]>(mockReviews);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedRatings,   setSelectedRatings]   = useState<number[]>([]);
  const [selectedStatus,    setSelectedStatus]    = useState<ReviewStatus | 'all'>('all');

  const togglePlatform = useCallback((p: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  }, []);

  const toggleRating = useCallback((r: number) => {
    setSelectedRatings(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  }, []);

  const filteredReviews = reviews.filter(review => {
    if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(review.platform)) return false;
    if (selectedRatings.length > 0   && !selectedRatings.includes(review.rating))     return false;
    if (selectedStatus !== 'all'     && review.status !== selectedStatus)              return false;
    return true;
  });

  const handleRowClick = useCallback((review: DBReview) => {
    setCurrentReview(review);
    navigate(`/editor/${review.id}`);
  }, [navigate, setCurrentReview]);

  const clearFilters = () => {
    setSelectedPlatforms([]);
    setSelectedRatings([]);
    setSelectedStatus('all');
  };

  const hasActiveFilters =
    selectedPlatforms.length > 0 ||
    selectedRatings.length > 0   ||
    selectedStatus !== 'all';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{ padding: '28px 32px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{
            fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)',
            letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0,
          }}>
            Review Queue
          </h1>
          <span style={{
            fontSize: '12px', fontWeight: 600, padding: '2px 8px',
            borderRadius: '999px', background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)', color: 'var(--text-secondary)',
          }}>
            {filteredReviews.length} / {reviews.length}
          </span>
        </div>

        {/* ── Filters ── */}
        <div style={{
          padding: '14px 16px', background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {/* Platform */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', minWidth: 54 }}>
              Platform
            </span>
            {PLATFORMS.map(p => (
              <Chip key={p} active={selectedPlatforms.includes(p)} onClick={() => togglePlatform(p)}>
                {PLATFORM_LABELS[p]}
              </Chip>
            ))}
          </div>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', minWidth: 54 }}>
              Rating
            </span>
            {RATINGS.map(r => (
              <Chip key={r} active={selectedRatings.includes(r)} onClick={() => toggleRating(r)}>
                {'★'.repeat(r)} {r}★
              </Chip>
            ))}
          </div>

          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', minWidth: 54 }}>
              Status
            </span>
            {STATUSES.map(s => (
              <Chip key={s.key} active={selectedStatus === s.key} onClick={() => setSelectedStatus(s.key)}>
                {s.label}
              </Chip>
            ))}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  marginLeft: 4, fontSize: '12px', color: 'var(--text-tertiary)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', padding: '4px 6px',
                  transition: 'color 150ms ease',
                }}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── List ── */}
      <div style={{ padding: '16px 32px 32px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {filteredReviews.map((review, idx) => (
          <ReviewRow
            key={review.id}
            review={review}
            index={idx}
            onClick={handleRowClick}
          />
        ))}

        {filteredReviews.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '64px 32px', gap: 12,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: 0 }}>
              No reviews match your filters
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  fontSize: '13px', color: '#ff6b35', background: 'rgba(255,107,53,0.10)',
                  border: '1px solid rgba(255,107,53,0.25)', borderRadius: 'var(--radius-sm)',
                  padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {filteredReviews.length > 0 && (
          <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '12px', color: 'var(--text-tertiary)' }}>
            All {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''} shown
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewQueue;
