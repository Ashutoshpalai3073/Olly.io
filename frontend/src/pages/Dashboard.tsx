import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useReviewStore, useAuthStore } from '../store';
import { ReviewRow } from '../components/review/ReviewRow';
import { useCountUp } from '../hooks/useCountUp';
import type { DBReview } from '../lib/supabase';

// ── Time-aware greeting ────────────────────────────────────────
function getGreeting(name: string): string {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return `Good ${time}, ${name.split(' ')[0]}`;
}

// ── Platform colors ────────────────────────────────────────────
const PLATFORM_COLOR: Record<string, string> = {
  google: '#4285F4', zomato: '#E23744', swiggy: '#FC8019', tripadvisor: '#00AA6C',
};
const PLATFORM_LABEL: Record<string, string> = {
  google: 'Google', zomato: 'Zomato', swiggy: 'Swiggy', tripadvisor: 'TripAdvisor',
};

// ── Stats ──────────────────────────────────────────────────────
function computeStats(reviews: DBReview[]) {
  const total     = reviews.length;
  const avgRating = total > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
    : 0;
  const responded = reviews.filter(r => r.status === 'posted').length;
  const pending   = reviews.filter(r => r.status === 'pending').length;
  const rate      = total > 0 ? Math.round((responded / total) * 100) : 0;

  const byPlatform: Record<string, number> = {};
  reviews.forEach(r => { byPlatform[r.platform] = (byPlatform[r.platform] || 0) + 1; });

  const now    = Date.now();
  const weekMs = 7 * 24 * 3600 * 1000;
  const thisW  = reviews.filter(r => now - new Date(r.created_at).getTime() <  weekMs);
  const lastW  = reviews.filter(r => { const a = now - new Date(r.created_at).getTime(); return a >= weekMs && a < 2 * weekMs; });
  const tAvg   = thisW.length ? thisW.reduce((s, r) => s + r.rating, 0) / thisW.length : 0;
  const lAvg   = lastW.length ? lastW.reduce((s, r) => s + r.rating, 0) / lastW.length : 0;
  const trend: 'up' | 'down' | 'same' = tAvg > lAvg ? 'up' : tAvg < lAvg ? 'down' : 'same';

  return { total, avgRating, responded, pending, rate, byPlatform, trend };
}

// ── Donut chart ────────────────────────────────────────────────
function DonutChart({ data }: { data: Record<string, number> }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const total = Object.values(data).reduce((s, v) => s + v, 0);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  if (total === 0) return null;

  const R = 60, cx = 80, cy = 80;
  const circumference = 2 * Math.PI * R;
  const gap = 3;

  let offset = 0;
  const segments = Object.entries(data).map(([platform, count]) => {
    const frac  = count / total;
    const len   = frac * circumference - gap;
    const rot   = (offset / circumference) * 360 - 90;
    offset += frac * circumference;
    return { platform, count, len, rot, color: PLATFORM_COLOR[platform] ?? '#888' };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
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
              style={{ transition: 'stroke-dasharray 0.8s ease, stroke-width 0.15s ease', cursor: 'pointer', opacity: hovered && !isHov ? 0.55 : 1 }}
              onMouseEnter={() => setHovered(s.platform)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        {/* Center text */}
        <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: 'var(--text-primary)' }}>{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--text-tertiary)' }}>reviews</text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map(s => (
          <div key={s.platform}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: hovered && hovered !== s.platform ? 0.5 : 1, transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHovered(s.platform)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{PLATFORM_LABEL[s.platform] ?? s.platform}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginLeft: 'auto' }}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hovered && data[hovered] !== undefined && (
        <div style={{
          position: 'absolute', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: '12px', color: 'var(--text-primary)',
          pointerEvents: 'none', boxShadow: 'var(--shadow-elevated)',
        }}>
          {PLATFORM_LABEL[hovered]}: <strong>{data[hovered]}</strong>
        </div>
      )}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = false, warn = false }: {
  label: string; value: string | number; sub?: React.ReactNode; accent?: boolean; warn?: boolean;
}) {
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: `1px solid ${accent ? 'var(--accent-border)' : warn ? 'rgba(239,68,68,0.25)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-md)', padding: '16px 18px',
      background: accent ? 'var(--accent-muted)' : warn ? 'rgba(239,68,68,0.06)' : 'var(--bg-elevated)',
    } as React.CSSProperties}>
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

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'same' }) {
  if (trend === 'same') return <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>— steady</span>;
  return (
    <span style={{ color: trend === 'up' ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 3, fontSize: '12px' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        {trend === 'up' ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
      </svg>
      {trend === 'up' ? 'trending up' : 'trending down'}
    </span>
  );
}

function RateBar({ pct }: { pct: number }) {
  return (
    <div style={{ height: 3, background: 'var(--bg-active)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--green)', borderRadius: 2, transition: 'width 1s ease' }} />
    </div>
  );
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400)return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ── Page ───────────────────────────────────────────────────────
export function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { reviews, fetchReviews, setCurrentReview } = useReviewStore();

  useEffect(() => { fetchReviews(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => computeStats(reviews), [reviews]);

  const totalCount  = useCountUp(stats.total);
  const pendingCount = useCountUp(stats.pending);
  const rateCount   = useCountUp(stats.rate);
  const avgDisplay  = useCountUp(Math.round(stats.avgRating * 10));

  const pendingReviews = useMemo(
    () => reviews.filter(r => r.status === 'pending').slice(0, 3),
    [reviews]
  );

  const activityFeed = useMemo(() => {
    return [...reviews]
      .filter(r => r.status === 'posted')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [reviews]);

  const greeting = profile?.brand_name
    ? getGreeting(profile.brand_name)
    : 'Good day';

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 4px' }}>
          {greeting}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          {stats.pending > 0
            ? `You have ${stats.pending} review${stats.pending !== 1 ? 's' : ''} waiting for a response.`
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
        />
        <StatCard
          label="Pending"
          value={pendingCount}
          sub={pendingCount > 5 ? <span style={{ color: 'var(--red)', fontWeight: 600 }}>Needs attention</span> : <span>Up to date</span>}
          warn={stats.pending > 5}
          accent={stats.pending === 0}
        />
      </div>

      {/* Two-column content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* Left: queue preview + platform chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Platform chart */}
          {Object.keys(stats.byPlatform).length > 0 && (
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', padding: '18px 20px',
              position: 'relative',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
                Reviews by platform
              </div>
              <DonutChart data={stats.byPlatform} />
            </div>
          )}

          {/* Pending queue preview */}
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Needs your attention</span>
                {stats.pending > 3 && (
                  <span style={{ marginLeft: 8, fontSize: '11px', color: 'var(--text-tertiary)' }}>+{stats.pending - 3} more</span>
                )}
              </div>
              <Link to="/queue" style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
                View all →
              </Link>
            </div>

            {pendingReviews.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                🎉 No pending reviews
              </div>
            ) : (
              <div>
                {pendingReviews.map(review => (
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
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Recent activity</span>
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto', padding: '4px 0' }}>
            {activityFeed.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                No activity yet
              </div>
            ) : (
              activityFeed.map(review => (
                <div key={review.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '9px 16px', borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: `${PLATFORM_COLOR[review.platform] ?? '#888'}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLOR[review.platform] ?? '#888' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      <strong>Responded</strong> to{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>{review.reviewer_name ?? 'Anonymous'}</span>
                      {' '}on {PLATFORM_LABEL[review.platform] ?? review.platform}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {timeAgo(review.created_at)}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', gap: 1 }}>
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <span key={i} style={{ fontSize: '9px', color: '#f59e0b' }}>★</span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
