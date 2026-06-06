import React, { useState } from 'react';
import { useReviewStore } from '@/store';
import type { ReviewStatus } from '@/lib/supabase';
import type { Platform } from '@/components/ui/PlatformBadge';

// ── constants ────────────────────────────────────────────────

const PLATFORMS: { value: Platform; label: string; color: string }[] = [
  { value: 'google',      label: 'Google',      color: '#4285F4' },
  { value: 'zomato',      label: 'Zomato',      color: '#E23744' },
  { value: 'swiggy',      label: 'Swiggy',      color: '#FC8019' },
  { value: 'tripadvisor', label: 'TripAdvisor',  color: '#00AA6C' },
];

type StatusOption = ReviewStatus | 'all';

const STATUSES: { value: StatusOption; label: string }[] = [
  { value: 'all',     label: 'All'      },
  { value: 'pending', label: 'Pending'  },
  { value: 'draft',   label: 'Draft'    },
  { value: 'posted',  label: 'Posted'   },
  { value: 'ignored', label: 'Ignored'  },
];

const RATINGS = [1, 2, 3, 4, 5] as const;

type DatePreset = '7d' | '30d' | 'all';
const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: '7d',  label: 'Last 7 days'  },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time'     },
];

// ── component ────────────────────────────────────────────────

export interface FilterBarProps {
  className?: string;
  style?: React.CSSProperties;
}

export function FilterBar({ className = '', style }: FilterBarProps) {
  const filters      = useReviewStore((s) => s.filters);
  const setFilters   = useReviewStore((s) => s.setFilters);
  const resetFilters = useReviewStore((s) => s.resetFilters);

  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Derived: how many non-default filters are active */
  const activeCount = [
    filters.platform !== 'all',
    filters.rating   !== null,
    filters.status   !== 'all',
    datePreset       !== 'all',
  ].filter(Boolean).length;

  const handlePlatform = (p: Platform) => {
    setFilters({ platform: filters.platform === p ? 'all' : p });
  };

  const handleRating = (r: number) => {
    setFilters({ rating: filters.rating === r ? null : r });
  };

  const handleStatus = (s: StatusOption) => {
    setFilters({ status: s });
  };

  const handleDate = (d: DatePreset) => {
    setDatePreset(d);
    /* Store doesn't have a date filter yet — wire in when schema is extended */
  };

  const clearAll = () => {
    resetFilters();
    setDatePreset('all');
    setMobileOpen(false);
  };

  // ── shared chip style ──────────────────────────────────────
  const chipStyle = (active: boolean, color?: string): React.CSSProperties => ({
    display:      'inline-flex',
    alignItems:   'center',
    gap:          5,
    padding:      '4px 11px',
    borderRadius: '999px',
    fontSize:     '12px',
    fontWeight:   500,
    cursor:       'pointer',
    border:       `1px solid ${active ? (color ? `${color}50` : 'var(--accent-border)') : 'var(--border-default)'}`,
    background:   active ? (color ? `${color}18` : 'var(--accent-muted)') : 'var(--bg-elevated)',
    color:        active ? (color ?? 'var(--accent-primary)') : 'var(--text-secondary)',
    transition:   'all var(--transition-base)',
    userSelect:   'none',
    whiteSpace:   'nowrap',
    fontFamily:   'inherit',
  });

  const innerContent = (
    <div
      style={{
        display:        'flex',
        flexWrap:       'wrap',
        gap:            '16px 24px',
        alignItems:     'flex-start',
      }}
    >
      {/* ── Platform ──────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Platform
        </span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePlatform(p.value)}
              style={chipStyle(filters.platform === p.value, p.color)}
            >
              <span
                style={{
                  width:        8,
                  height:       8,
                  borderRadius: '50%',
                  background:   p.color,
                  flexShrink:   0,
                }}
              />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Rating ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Rating
        </span>
        <div style={{ display: 'flex', gap: 5 }}>
          {RATINGS.map((r) => {
            const active = filters.rating === r;
            return (
              <button
                key={r}
                onClick={() => handleRating(r)}
                title={`${r} star${r > 1 ? 's' : ''}`}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  width:          34,
                  height:         34,
                  borderRadius:   'var(--radius-md)',
                  border:         `1px solid ${active ? 'rgba(245,158,11,0.4)' : 'var(--border-default)'}`,
                  background:     active ? 'rgba(245,158,11,0.12)' : 'var(--bg-elevated)',
                  cursor:         'pointer',
                  fontSize:       '13px',
                  fontWeight:     600,
                  color:          active ? '#f59e0b' : 'var(--text-secondary)',
                  transition:     'all var(--transition-base)',
                  fontFamily:     'inherit',
                  gap:            3,
                  flexShrink:     0,
                }}
              >
                {r}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill={active ? '#f59e0b' : 'currentColor'}
                  style={{ opacity: active ? 1 : 0.5 }}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Status ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Status
        </span>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => handleStatus(s.value)}
              style={chipStyle(filters.status === s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Date range ────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Date range
        </span>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {DATE_PRESETS.map((d) => (
            <button
              key={d.value}
              onClick={() => handleDate(d.value)}
              style={chipStyle(datePreset === d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Clear all ─────────────────────────────────────── */}
      {activeCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 1 }}>
          <button
            onClick={clearAll}
            style={{
              background:   'transparent',
              border:       'none',
              fontSize:     '12px',
              fontWeight:   500,
              color:        'var(--text-tertiary)',
              cursor:       'pointer',
              padding:      '4px 0',
              fontFamily:   'inherit',
              transition:   'color var(--transition-base)',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={className} style={style}>
      {/* ── Mobile toggle ───────────────────────────────── */}
      <div
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         8,
          marginBottom: mobileOpen ? 14 : 0,
        }}
      >
        <button
          onClick={() => setMobileOpen((o) => !o)}
          style={{
            display:     'none', // shown via media query CSS-in-js isn't easy; show always for simplicity
            alignItems:  'center',
            gap:         6,
            padding:     '6px 12px',
            borderRadius: 'var(--radius-md)',
            background:  'var(--bg-elevated)',
            border:      `1px solid ${activeCount > 0 ? 'var(--accent-border)' : 'var(--border-default)'}`,
            color:       activeCount > 0 ? 'var(--accent-primary)' : 'var(--text-secondary)',
            cursor:      'pointer',
            fontSize:    '13px',
            fontWeight:  500,
            fontFamily:  'inherit',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="6"  x2="20" y2="6" />
            <line x1="8" y1="12" x2="20" y2="12" />
            <line x1="12" y1="18" x2="20" y2="18" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span
              style={{
                background:   'var(--accent-primary)',
                color:        '#fff',
                borderRadius: '999px',
                fontSize:     '10px',
                fontWeight:   700,
                padding:      '1px 5px',
                minWidth:     16,
                textAlign:    'center',
                lineHeight:   1.6,
              }}
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter content (always visible on desktop) */}
      {innerContent}
    </div>
  );
}

export default FilterBar;
