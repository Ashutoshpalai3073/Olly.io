import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { DBReview, ReviewStatus } from '@/lib/supabase';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import PlatformBadge from '@/components/ui/PlatformBadge';
import Badge from '@/components/ui/Badge';
import type { Platform } from '@/components/ui/PlatformBadge';
import type { BadgeProps } from '@/components/ui/Badge';

// ── helpers ──────────────────────────────────────────────────

const SUPPORTED_PLATFORMS = new Set<string>(['google', 'zomato', 'swiggy', 'tripadvisor']);

const EXCERPT_LIMIT = 80;

function excerpt(text: string): string {
  return text.length > EXCERPT_LIMIT
    ? `${text.slice(0, EXCERPT_LIMIT).trimEnd()}…`
    : text;
}

function timeShort(dateStr: string): string {
  const ms   = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 60)  return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const mo = Math.floor(days / 30);
  if (mo   < 12)  return `${mo} ${mo === 1 ? 'month' : 'months'} ago`;
  const yrs = Math.floor(mo / 12);
  return `${yrs} ${yrs === 1 ? 'year' : 'years'} ago`;
}

const STATUS_VARIANT: Record<ReviewStatus, BadgeProps['variant']> = {
  pending: 'warning',
  draft:   'info',
  posted:  'success',
  ignored: 'default',
};

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: 'Pending',
  draft:   'Draft',
  posted:  'Posted',
  ignored: 'Ignored',
};

// ── row motion variant ────────────────────────────────────────
// Parent container should set `variants={{ container: { ... } }}`
// so stagger works. Children pick up the item variant.
export const rowVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
};

// ── component ────────────────────────────────────────────────

export interface ReviewRowProps {
  review:    DBReview;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onClick?:  (review: DBReview) => void;
  index?:    number;
}

const MAX_VISIBLE_TAGS = 2;

export function ReviewRow({
  review,
  selected = false,
  onSelect,
  onClick,
  index = 0,
}: ReviewRowProps) {
  const [hovered, setHovered] = useState(false);

  const complaints = review.tags?.complaints ?? [];
  const praises    = review.tags?.praises    ?? [];
  const allTags    = [...complaints.map((t) => ({ label: t, type: 'complaint' as const })),
                      ...praises.map((t)    => ({ label: t, type: 'praise' as const    }))];
  const visibleTags  = allTags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount  = allTags.length - visibleTags.length;

  const handleClick = (e: React.MouseEvent) => {
    /* Don't navigate if clicking the checkbox */
    if ((e.target as HTMLElement).closest('[data-checkbox]')) return;
    onClick?.(review);
  };

  return (
    <motion.div
      variants={rowVariants}
      custom={index}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           12,
        padding:       '12px 16px',
        background:    hovered ? 'var(--bg-hover)' : 'var(--bg-elevated)',
        border:        `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border-default)'}`,
        borderRadius:  'var(--radius-lg)',
        cursor:        'pointer',
        transition:    'background var(--transition-base), border-color var(--transition-base)',
        userSelect:    'none',
        position:      'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* ── Checkbox (shows on hover or when selected) ─────── */}
      {onSelect && (
        <span
          data-checkbox
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:          18,
            height:         18,
            flexShrink:     0,
            opacity:        hovered || selected ? 1 : 0,
            transition:     'opacity var(--transition-base)',
          }}
          onClick={(e) => { e.stopPropagation(); onSelect(review.id, !selected); }}
        >
          <input
            type="checkbox"
            checked={selected}
            readOnly
            style={{
              width:        16,
              height:       16,
              accentColor:  'var(--accent-primary)',
              cursor:       'pointer',
            }}
          />
        </span>
      )}

      {/* ── Avatar ───────────────────────────────────────── */}
      <Avatar name={review.reviewer_name ?? 'Anonymous'} size="sm" style={{ flexShrink: 0 }} />

      {/* ── Main content ─────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Row 1: name + platform + rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize:  '13px',
              fontWeight: 600,
              color:     'var(--text-primary)',
              whiteSpace: 'nowrap',
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

          <StarRating value={review.rating} size={12} animate={false} />
        </div>

        {/* Row 2: excerpt */}
        <span
          style={{
            fontSize:  '12.5px',
            color:     'var(--text-tertiary)',
            lineHeight: 1.45,
            overflow:  'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {excerpt(review.review_text)}
        </span>

        {/* Row 3: tags */}
        {allTags.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap', overflow: 'hidden' }}>
            {visibleTags.map((t) => (
              <span
                key={`${t.type}-${t.label}`}
                style={{
                  fontSize:     '10.5px',
                  fontWeight:   500,
                  padding:      '1px 6px',
                  borderRadius: '999px',
                  whiteSpace:   'nowrap',
                  flexShrink:   0,
                  ...(t.type === 'complaint'
                    ? {
                        background: 'rgba(239,68,68,0.10)',
                        color:      'var(--red)',
                        border:     '1px solid rgba(239,68,68,0.18)',
                      }
                    : {
                        background: 'rgba(34,197,94,0.10)',
                        color:      'var(--green)',
                        border:     '1px solid rgba(34,197,94,0.18)',
                      }),
                }}
              >
                {t.label}
              </span>
            ))}
            {hiddenCount > 0 && (
              <span
                style={{
                  fontSize:     '10.5px',
                  fontWeight:   500,
                  color:        'var(--text-tertiary)',
                  whiteSpace:   'nowrap',
                  flexShrink:   0,
                }}
              >
                +{hiddenCount} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Right side: status + time + chevron ──────────── */}
      <div
        style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'flex-end',
          gap:            5,
          flexShrink:     0,
        }}
      >
        <Badge variant={STATUS_VARIANT[review.status]} size="sm">
          {STATUS_LABEL[review.status]}
        </Badge>

        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
          {timeShort(review.review_date)}
        </span>
      </div>

      {/* Chevron */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: 'var(--text-tertiary)', flexShrink: 0, opacity: hovered ? 1 : 0.4, transition: 'opacity var(--transition-base)' }}
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </motion.div>
  );
}

export default ReviewRow;
