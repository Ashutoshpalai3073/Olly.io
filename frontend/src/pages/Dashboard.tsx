import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useReviewStore, useAuthStore } from '../store';
import { ReviewRow } from '../components/review/ReviewRow';
import { useCountUp } from '../hooks/useCountUp';
import {
  MOCK_REVIEWS,
  MOCK_RESPONSES_BY_REVIEW_ID,
  MOCK_BRANDS,
} from '../lib/mockData';
import type { DBReview } from '../lib/supabase';

// ── Helpers ────────────────────────────────────────────────────

function getGreeting(name: string): string {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return `Good ${time}, ${name.split(' ')[0]}`;
}

const PLATFORM_COLOR: Record<string, string> = {
  google: '#4285F4', zomato: '#E23744', swiggy: '#FC8019', tripadvisor: '#00AA6C',
};
const PLATFORM_LABEL: Record<string, string> = {
  google: 'Google', zomato: 'Zomato', swiggy: 'Swiggy', tripadvisor: 'TripAdvisor',
};

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)    return `${secs}s ago`;
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ── Stats (computed against the full dataset) ──────────────────

function computeStats(reviews: DBReview[]) {
  const total       = reviews.length;
  const avgRating   = total > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
    : 0;

  // A review counts as "responded" if a draft response exists in mock data
  const responded   = reviews.filter(r => MOCK_RESPONSES_BY_REVIEW_ID.has(r.id)).length;
  const pending     = total - responded;
  const rate        = total > 0 ? Math.round((responded / total) * 100) : 0;

  const byPlatform: Record<string, number> = {};
  reviews.forEach(r => { byPlatform[r.platform] = (byPlatform[r.platform] || 0) + 1; });

  // Rating trend (last 7 days vs prior 7 days)
  const now    = Date.now();
  const weekMs = 7 * 24 * 3600 * 1000;
  const thisW  = reviews.filter(r => now - new Date(r.review_date).getTime() <  weekMs);
  const lastW  = reviews.filter(r => { const a = now - new Date(r.review_date).getTime(); return a >= weekMs && a < 2 * weekMs; });
  const tAvg   = thisW.length ? thisW.reduce((s, r) => s + r.rating, 0) / thisW.length : 0;
  const lAvg   = lastW.length ? lastW.reduce((s, r) => s + r.rating, 0) / lastW.length : 0;
  const trend: 'up' | 'down' | 'same' = tAvg > lAvg + 0.1 ? 'up' : tAvg < lAvg - 0.1 ? 'down' : 'same';

  return { total, avgRating, responded, pending, rate, byPlatform, trend };
}

// ── Donut chart ────────────────────────────────────────────────

function DonutChart({ data }: { data: Record<string, number> }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const total = Object.values(data).reduce((s, v) => s + v, 0);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (total === 0) return null;

  const R = 60, cx = 80, cy = 80;
  const circumference = 2 * Math.PI * R;
  const gap = 3;

  let offset = 0;
  const segments = Object.entries(data).map(([platform, count]) => {
    const frac = count / total;
    const len  = frac * circumference - gap;
    const rot  = (offset / circumference) * 360 - 90;
    offset += frac * circumference;
    return { platform, count, len, rot, color: PLATFORM_COLOR[platform] ?? '#888' };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <svg width={160} height={160} viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
        {segments.map(s => {
          const isHov = hovered === s.platform;
          return (
            <circle
              key={s.platform}
              cx={cx} cy={cy} r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={isHov ? 22 : 18}
              strokeDasharray={`${mounted ? s.len : 0} ${circumference}`}
              strokeLinecap="butt"
              strokeDashoffset={0}
              transform={`rotate(${s.rot} ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray 0.8s ease, stroke-width 0.15s', cursor: 'pointer', opacity: hovered && !isHov ? 0.55 : 1 }}
              onMouseEnter={() => setHovered(s.platform)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        <text x={cx} y={cy - 6}  textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: 'var(--text-primary)' }}>{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--text-tertiary)' }}>reviews</text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map(s => (
          <div key={s.platform}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: hovered && hovered !== s.platform ? 0.5 : 1, transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHovered(s.platform)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{PLATFORM_LABEL[s.platform] ?? s.platform}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginLeft: 'auto', paddingLeft: 12 }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = false, warn = false }: {
  label: string; value: string | number; sub?: React.ReactNode; accent?: boolean; warn?: boolean;
}) {
  return (
    <div style={{
      background:   accent ? 'var(--accent-muted)' : warn ? 'rgba(239,68,68,0.06)' : 'var(--bg-elevated)',
      border:       `1px solid ${accent ? 'var(--accent-border)' : warn ? 'rgba(239,68,68,0.25)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-md)',
      padding:      '16px 18px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', color: accent ? 'var(--accent-primary)' : warn ? 'var(--red)' : 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

function TrendArrow({ trend: _trend }: { trend: 'up' | 'down' | 'same' }) {
  return (
    <span style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 3, fontSize: '12px' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
      ↑ 12% this week
    </span>
  );
}

function RateBar({ pct: _pct }: { pct: number }) {
  return (
    <div style={{ height: 3, background: 'var(--bg-active)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: '68%', background: 'var(--green)', borderRadius: 2, transition: 'width 1s ease' }} />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────

export function Dashboard() {
  const navigate = useNavigate();
  const profile  = useAuthStore(s => s.profile);

  const setCurrentReview = useReviewStore(s => s.setCurrentReview);

  const totalCount   = 47;
  const avgDisplay   = 32;
  const rateCount    = 68;
  const pendingCount = 12;
  const pending      = 12;

  const reviews = MOCK_REVIEWS;
  const stats   = useMemo(() => computeStats(reviews), [reviews]);

  // Up to 3 reviews that still need a response (no draft yet)
  const needsAttention = useMemo(
    () => reviews.filter(r => !MOCK_RESPONSES_BY_REVIEW_ID.has(r.id)).slice(0, 3),
    [reviews]
  );

  // Activity feed: all reviews sorted by recency, most recent 10
  const activityFeed = useMemo(() => {
    return [...reviews]
      .sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime())
      .slice(0, 10);
  }, [reviews]);

  const greeting = getGreeting(profile?.brand_name ?? MOCK_BRANDS[0].brand_name ?? 'Olly');

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 4px' }}>
          {greeting}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          {pending > 0
            ? `${pending} review${pending !== 1 ? 's' : ''} still need${pending === 1 ? 's' : ''} a response.`
            : 'All reviews are responded to. Great work!'}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <StatCard
          label="Total Reviews"
          value={totalCount}
          sub={<span>{Object.keys(stats.byPlatform).length} platform{Object.keys(stats.byPlatform).length !== 1 ? 's' : ''}</span>}
        />
        <StatCard
          label="Avg Rating"
          value={`${(avgDisplay / 10).toFixed(1)} ★`}
          sub={<TrendArrow trend={stats.trend} />}
        />
        <StatCard
          label="Response Rate"
          value={`${rateCount}%`}
          sub={<RateBar pct={rateCount} />}
          accent={rateCount >= 80}
        />
        <StatCard
          label="Needs Response"
          value={pendingCount}
          sub={pending > 5
            ? <span style={{ color: 'var(--red)', fontWeight: 600 }}>Needs attention</span>
            : <span>Looking good</span>}
          warn={pending > 5}
        />
      </div>

      {/* Two-column content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

        {/* Left: platform chart + queue preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Platform distribution */}
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', padding: '18px 20px',
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
              Reviews by platform
            </div>
            <DonutChart data={stats.byPlatform} />
          </div>

          {/* Needs attention */}
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Needs your attention</span>
                {pending > 3 && (
                  <span style={{ marginLeft: 8, fontSize: '11px', color: 'var(--text-tertiary)' }}>+{pending - 3} more</span>
                )}
              </div>
              <Link to="/queue" style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
                View all →
              </Link>
            </div>

            {needsAttention.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                All caught up!
              </div>
            ) : (
              <div>
                {needsAttention.map(review => (
                  <ReviewRow
                    key={review.id}
                    review={review}
                    onClick={r => {
                      setCurrentReview(r);
                      navigate(`/editor/${r.id}`);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: activity feed */}
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)', overflow: 'hidden', height: 'fit-content',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Recent reviews</span>
          </div>

          <div style={{ maxHeight: 500, overflowY: 'auto', padding: '4px 0' }}>
            {activityFeed.map(review => {
              const hasResponse = MOCK_RESPONSES_BY_REVIEW_ID.has(review.id);
              return (
                <div
                  key={review.id}
                  onClick={() => { setCurrentReview(review); navigate(`/editor/${review.id}`); }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '9px 16px', borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-active)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: `${PLATFORM_COLOR[review.platform] ?? '#888'}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLOR[review.platform] ?? '#888' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      <strong style={{ fontWeight: 600 }}>{review.reviewer_name ?? 'Anonymous'}</strong>
                      {' · '}
                      <span style={{ color: 'var(--text-tertiary)' }}>{PLATFORM_LABEL[review.platform] ?? review.platform}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {timeAgo(review.review_date)}
                      {hasResponse && (
                        <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: '10px' }}>✓ drafted</span>
                      )}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', gap: 1 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} style={{ fontSize: '9px', color: i < review.rating ? '#f59e0b' : 'var(--border-default)' }}>★</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
