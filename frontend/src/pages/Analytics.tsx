import React, { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { LineChart }   from '../components/charts/LineChart';
import { BarChart }    from '../components/charts/BarChart';
import { DonutChart }  from '../components/charts/DonutChart';
import type { DateRange } from '../hooks/useAnalytics';

// ── Constants ───────────────────────────────────────────────────

const PLATFORM_COLOR: Record<string, string> = {
  google:      '#4285F4',
  zomato:      '#E23744',
  swiggy:      '#FC8019',
  tripadvisor: '#00AA6C',
};
const PLATFORM_LABEL: Record<string, string> = {
  google:      'Google',
  zomato:      'Zomato',
  swiggy:      'Swiggy',
  tripadvisor: 'TripAdvisor',
};

const STAR_COLORS: Record<number, string> = {
  5: '#22c55e',
  4: '#86efac',
  3: '#fbbf24',
  2: '#f97316',
  1: '#ef4444',
};

const RANGES: { label: string; value: DateRange }[] = [
  { label: 'Last 7d',    value: 7   },
  { label: 'Last 30d',   value: 30  },
  { label: 'Last 90d',   value: 90  },
  { label: 'All time',   value: 365 },
];

// ── Section wrapper ─────────────────────────────────────────────

function Section({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border:     '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding:    '20px 24px',
    }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Stat card ───────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <div style={{
      background:   'var(--bg-elevated)',
      border:       '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding:      '16px 20px',
      display:      'flex',
      flexDirection: 'column',
      gap:          6,
      flex:         1,
      minWidth:     0,
    }}>
      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: '26px', fontWeight: 700, color: accent ?? 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Platform table ──────────────────────────────────────────────

function PlatformTable({ stats }: {
  stats: Array<{ platform: string; reviewCount: number; responseRate: number; avgRating: number }>;
}) {
  const cols: { label: string; key: keyof (typeof stats)[0]; align?: 'left' | 'right' }[] = [
    { label: 'Platform',      key: 'platform',     align: 'left'  },
    { label: 'Reviews',       key: 'reviewCount',  align: 'right' },
    { label: 'Response Rate', key: 'responseRate', align: 'right' },
    { label: 'Avg Rating',    key: 'avgRating',    align: 'right' },
  ];

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
      <thead>
        <tr>
          {cols.map(c => (
            <th key={c.key} style={{
              textAlign: c.align ?? 'left',
              padding: '6px 8px',
              fontWeight: 500,
              color: 'var(--text-tertiary)',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {stats.map((s, i) => (
          <tr key={i} style={{ borderBottom: i < stats.length - 1 ? '1px solid var(--border-subtle)' : undefined }}>
            <td style={{ padding: '10px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: PLATFORM_COLOR[s.platform] ?? '#888',
                  flexShrink: 0,
                }} />
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                  {PLATFORM_LABEL[s.platform] ?? s.platform}
                </span>
              </div>
            </td>
            <td style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 500 }}>
              {s.reviewCount}
            </td>
            <td style={{ padding: '10px 8px', textAlign: 'right' }}>
              <span style={{
                color: s.responseRate >= 80 ? '#22c55e' : s.responseRate >= 50 ? '#fbbf24' : 'var(--red)',
                fontWeight: 600,
              }}>
                {s.responseRate}%
              </span>
            </td>
            <td style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>
              {s.avgRating.toFixed(1)} ★
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Top templates (mock) ────────────────────────────────────────

const MOCK_TEMPLATES = [
  { preview: 'Thank you so much for your kind words! We\'re thrilled to hear your experience was memorable…', usage: 24, improvement: '+0.8★' },
  { preview: 'We sincerely apologise for the experience you had. This is not the standard we hold ourselves to…', usage: 17, improvement: '+1.2★' },
  { preview: 'Your feedback about the wait time is something we\'re actively working to improve…', usage: 11, improvement: '+0.5★' },
];

// ── Main page ───────────────────────────────────────────────────

export function Analytics() {
  const [range, setRange] = useState<DateRange>(30);
  const data = useAnalytics(range);

  const {
    totalReviews,
    totalResponses,
    responseRate,
    avgResponseTime,
    timeSaved,
    positiveSentiment,
    ratingTrend,
    ratingDist,
    platformStats,
    reviewsOverTime,
    responsesOverTime,
    topComplaints,
  } = data;

  const ratingDistBars = [5, 4, 3, 2, 1].map(star => ({
    label: `${star} ★`,
    value: ratingDist[star] ?? 0,
    color: STAR_COLORS[star],
  }));

  const platformDonut = platformStats.map(s => ({
    label: PLATFORM_LABEL[s.platform] ?? s.platform,
    value: s.reviewCount,
    color: PLATFORM_COLOR[s.platform] ?? '#888',
  }));

  const trendSign    = ratingTrend.direction === 'up' ? '+' : ratingTrend.direction === 'down' ? '' : '±';
  const trendColor   = ratingTrend.direction === 'up' ? '#22c55e' : ratingTrend.direction === 'down' ? 'var(--red)' : 'var(--text-tertiary)';
  const trendLabel   = ratingTrend.direction === 'same'
    ? `Average rating stayed at ${ratingTrend.current} ★ this period.`
    : `Average rating ${ratingTrend.direction === 'up' ? 'improved' : 'dropped'} by ${Math.abs(ratingTrend.delta)} ★ vs the prior ${range}d period.`;

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 48px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              Analytics
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-tertiary)' }}>
              {totalReviews} reviews · {totalResponses} responses
            </p>
          </div>

          {/* Range selector */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-active)', borderRadius: 'var(--radius-lg)', padding: 3 }}>
            {RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                style={{
                  padding:      '5px 12px',
                  fontSize:     '12px',
                  fontFamily:   'inherit',
                  fontWeight:   range === r.value ? 600 : 400,
                  background:   range === r.value ? 'var(--bg-elevated)' : 'transparent',
                  color:        range === r.value ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  border:       'none',
                  borderRadius: 'var(--radius-md)',
                  cursor:       'pointer',
                  boxShadow:    range === r.value ? 'var(--shadow-sm)' : 'none',
                  transition:   'all var(--transition-base)',
                  whiteSpace:   'nowrap',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <StatCard
            label="Total responses"
            value={totalResponses}
            sub={`out of ${totalReviews} reviews`}
          />
          <StatCard
            label="Avg response time"
            value={avgResponseTime === 0 ? '—' : `${avgResponseTime}h`}
            sub="from review to reply"
          />
          <StatCard
            label="Time saved"
            value={timeSaved.formatted}
            sub="at 8 min/response"
            accent="var(--accent-primary)"
          />
          <StatCard
            label="Positive sentiment"
            value={`${positiveSentiment}%`}
            sub="4–5 star reviews"
            accent={positiveSentiment >= 70 ? '#22c55e' : positiveSentiment >= 50 ? '#fbbf24' : 'var(--red)'}
          />
        </div>

        {/* Response Rate Over Time */}
        <div style={{ marginBottom: 20 }}>
          <Section title="Response Rate Over Time" subtitle="Daily reviews received vs responses sent">
            <LineChart
              series={[
                { label: 'Reviews received', points: reviewsOverTime.map(d => ({ label: d.date, value: d.count })), color: 'var(--text-tertiary)' },
                { label: 'Responses sent',   points: responsesOverTime.map(d => ({ label: d.date, value: d.count })), color: 'var(--accent-primary)' },
              ]}
              height={200}
              showGrid
              showDots={false}
              animated
            />
          </Section>
        </div>

        {/* Rating Distribution */}
        <div style={{ marginBottom: 20 }}>
          <Section title="Rating Distribution">
            <BarChart
              data={ratingDistBars}
              barHeight={26}
              gap={8}
            />
            <p style={{ margin: '12px 0 0', fontSize: '12px', color: trendColor, fontWeight: 500 }}>
              {trendSign}{ratingTrend.delta !== 0 ? Math.abs(ratingTrend.delta) + ' ★ · ' : ''}{trendLabel}
            </p>
          </Section>
        </div>

        {/* Two-column: complaints + platform */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* Top Complaints */}
          <Section title="Top Complaint Categories" subtitle="Most common issues mentioned in reviews">
            {topComplaints.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>No complaint tags found.</p>
            ) : (
              <BarChart
                data={topComplaints.map(t => ({ label: t.tag, value: t.count, color: '#ef4444' }))}
                barHeight={22}
                gap={7}
              />
            )}
          </Section>

          {/* Platform Breakdown */}
          <Section title="Platform Breakdown">
            {platformDonut.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>No platform data.</p>
            ) : (
              <>
                <DonutChart
                  data={platformDonut}
                  size={140}
                  thickness={26}
                  showLegend={false}
                  centerLabel={
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {totalReviews}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>reviews</div>
                    </div>
                  }
                />
                <div style={{ marginTop: 16 }}>
                  <PlatformTable stats={platformStats} />
                </div>
              </>
            )}
          </Section>
        </div>

        {/* Top Performing Templates */}
        <Section
          title="Top Performing Response Templates"
          subtitle="Templates associated with positive follow-up reviews"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_TEMPLATES.map((t, i) => (
              <div
                key={i}
                style={{
                  display:      'flex',
                  alignItems:   'flex-start',
                  gap:          16,
                  padding:      '14px 16px',
                  background:   'var(--bg-primary)',
                  border:       '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <div style={{
                  width: 28, height: 28,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-active)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)',
                  flexShrink: 0,
                }}>
                  #{i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {t.preview}
                  </p>
                </div>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {t.usage} uses
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#22c55e' }}>
                    {t.improvement}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

export default Analytics;
