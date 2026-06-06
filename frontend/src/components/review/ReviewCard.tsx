import React, { useState } from 'react';
import type { DBReview } from '@/lib/supabase';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import PlatformBadge from '@/components/ui/PlatformBadge';
import type { Platform } from '@/components/ui/PlatformBadge';

// ── helpers ──────────────────────────────────────────────────

const SUPPORTED_PLATFORMS = new Set<string>(['google', 'zomato', 'swiggy', 'tripadvisor']);

function timeAgo(dateStr: string): string {
  const ms   = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30)  return `${days} days ago`;
  const mo = Math.floor(days / 30);
  if (mo === 1)   return '1 month ago';
  if (mo < 12)    return `${mo} months ago`;
  const yr = Math.floor(mo / 12);
  return yr === 1 ? '1 year ago' : `${yr} years ago`;
}

// ── component ────────────────────────────────────────────────

export interface ReviewCardProps {
  review: DBReview;
  className?: string;
  style?: React.CSSProperties;
}

const TEXT_LIMIT = 200;

const tagStyle = (sentiment: 'complaint' | 'praise'): React.CSSProperties =>
  sentiment === 'complaint'
    ? {
        background: 'rgba(239,68,68,0.10)',
        color: 'var(--red)',
        border: '1px solid rgba(239,68,68,0.20)',
      }
    : {
        background: 'rgba(34,197,94,0.10)',
        color: 'var(--green)',
        border: '1px solid rgba(34,197,94,0.20)',
      };

export function ReviewCard({ review, className = '', style }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isLong     = review.review_text.length > TEXT_LIMIT;
  const displayText = expanded || !isLong
    ? review.review_text
    : `${review.review_text.slice(0, TEXT_LIMIT).trimEnd()}…`;

  const complaints = review.tags?.complaints ?? [];
  const praises    = review.tags?.praises    ?? [];
  const hasTags    = complaints.length > 0 || praises.length > 0;

  return (
    <div
      className={className}
      style={{
        background:   'var(--bg-elevated)',
        border:       '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding:      20,
        display:      'flex',
        flexDirection:'column',
        gap:          14,
        ...style,
      }}
    >
      {/* ── Header ───────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Avatar name={review.reviewer_name ?? 'Anonymous'} size="md" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              {review.reviewer_name ?? 'Anonymous'}
            </span>

            {SUPPORTED_PLATFORMS.has(review.platform) && (
              <PlatformBadge
                platform={review.platform as Platform}
                size="sm"
                showName={false}
              />
            )}
          </div>

          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              marginTop: 3,
              lineHeight: 1.4,
            }}
          >
            {timeAgo(review.review_date)}
            {review.location_name && (
              <span> · {review.location_name}</span>
            )}
          </div>
        </div>

        <StarRating value={review.rating} size={14} animate={false} />
      </div>

      {/* ── Review text ──────────────────────────────────── */}
      <div>
        <p
          style={{
            fontSize:    '13.5px',
            color:       'var(--text-secondary)',
            lineHeight:  1.7,
            margin:      0,
            whiteSpace:  'pre-wrap',
            wordBreak:   'break-word',
          }}
        >
          {displayText}
        </p>

        {isLong && (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              marginTop:  6,
              background: 'none',
              border:     'none',
              padding:    0,
              fontSize:   '13px',
              fontWeight: 500,
              color:      'var(--accent-primary)',
              cursor:     'pointer',
              fontFamily: 'inherit',
              lineHeight: 1.4,
            }}
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* ── Tags ─────────────────────────────────────────── */}
      {hasTags && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {complaints.map((tag) => (
            <span
              key={`c-${tag}`}
              style={{
                fontSize:     '11px',
                fontWeight:   500,
                padding:      '2px 8px',
                borderRadius: '999px',
                lineHeight:   1.5,
                ...tagStyle('complaint'),
              }}
            >
              {tag}
            </span>
          ))}
          {praises.map((tag) => (
            <span
              key={`p-${tag}`}
              style={{
                fontSize:     '11px',
                fontWeight:   500,
                padding:      '2px 8px',
                borderRadius: '999px',
                lineHeight:   1.5,
                ...tagStyle('praise'),
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewCard;
