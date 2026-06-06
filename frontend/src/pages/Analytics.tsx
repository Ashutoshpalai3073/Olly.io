import { useEffect, useRef, useState } from 'react';

// ── Hardcoded data ─────────────────────────────────────────────

const STATS = [
  {
    label: 'Responses Sent',
    value: '34',
    sub:   'this month',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    ),
    accent: '#ff6b35',
  },
  {
    label: 'Avg Response Time',
    value: '2.4 hrs',
    sub:   'per review',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    accent: '#3b82f6',
  },
  {
    label: 'Time Saved',
    value: '4h 32m',
    sub:   'vs manual writing',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
    ),
    accent: '#22c55e',
  },
  {
    label: 'Positive Sentiment',
    value: '71%',
    sub:   'of responses',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    ),
    accent: '#f59e0b',
  },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const REVIEWS_DATA   = [8,  6,  9,  4, 11, 14,  7];
const RESPONSES_DATA = [5,  4,  7,  3,  8, 10,  5];

const RATINGS = [
  { stars: 5, count: 14, color: '#22c55e' },
  { stars: 4, count: 15, color: '#86efac' },
  { stars: 3, count: 8,  color: '#fbbf24' },
  { stars: 2, count: 6,  color: '#f97316' },
  { stars: 1, count: 4,  color: '#ef4444' },
];

const COMPLAINTS = [
  { label: 'Slow service',    count: 12, color: '#ef4444' },
  { label: 'Long wait time',  count: 9,  color: '#f97316' },
  { label: 'Cold food',       count: 7,  color: '#fb923c' },
  { label: 'Wrong order',     count: 5,  color: '#fbbf24' },
  { label: 'Rude staff',      count: 4,  color: '#fcd34d' },
];

const PLATFORMS = [
  { name: 'Google',      dot: '#4285F4', reviews: 22, rate: 78, rating: 3.8 },
  { name: 'Zomato',      dot: '#E23744', reviews: 12, rate: 65, rating: 3.2 },
  { name: 'Swiggy',      dot: '#FC8019', reviews: 8,  rate: 58, rating: 3.5 },
  { name: 'TripAdvisor', dot: '#00AA6C', reviews: 5,  rate: 80, rating: 4.1 },
];

// ── Helpers ────────────────────────────────────────────────────

function useAnimated(trigger: boolean, duration = 900): number {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger) return;
    startRef.current = null;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trigger, duration]);

  return progress;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="10" height="10" viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
          stroke="#f59e0b" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

// ── Card ───────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, accent }: typeof STATS[0]) {
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 12,
      flex: 1, minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </span>
        <span style={{
          width: 32, height: 32, borderRadius: 'var(--radius-sm)',
          background: `${accent}18`, color: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {icon}
        </span>
      </div>
      <div>
        <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: 5 }}>{sub}</div>
      </div>
    </div>
  );
}

// ── Line chart ─────────────────────────────────────────────────

const CHART_W = 560;
const CHART_H = 200;
const PAD_L = 36;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 32;
const Y_MAX = 16;

function xPos(i: number) {
  return PAD_L + (i / (DAYS.length - 1)) * (CHART_W - PAD_L - PAD_R);
}
function yPos(v: number) {
  return PAD_T + (1 - v / Y_MAX) * (CHART_H - PAD_T - PAD_B);
}
function smooth(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`;
  }
  return d;
}

function LineChartSVG({ progress }: { progress: number }) {
  const reviewPts  = REVIEWS_DATA.map((v, i)   => [xPos(i), yPos(v)] as [number, number]);
  const responsePts = RESPONSES_DATA.map((v, i) => [xPos(i), yPos(v)] as [number, number]);
  const rPath = smooth(reviewPts);
  const sPth  = smooth(responsePts);

  const totalLen = 700;
  const drawn    = totalLen * progress;

  return (
    <svg width="100%" viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ overflow: 'visible' }}>
      {/* Y-axis gridlines */}
      {[0, 4, 8, 12, 16].map(v => (
        <g key={v}>
          <line
            x1={PAD_L} y1={yPos(v)} x2={CHART_W - PAD_R} y2={yPos(v)}
            stroke="var(--border-subtle)" strokeWidth="1"
          />
          <text x={PAD_L - 6} y={yPos(v) + 4} textAnchor="end"
            style={{ fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'inherit' }}>
            {v}
          </text>
        </g>
      ))}

      {/* X-axis labels */}
      {DAYS.map((d, i) => (
        <text key={d} x={xPos(i)} y={CHART_H - 4} textAnchor="middle"
          style={{ fontSize: 11, fill: 'var(--text-tertiary)', fontFamily: 'inherit' }}>
          {d}
        </text>
      ))}

      {/* Reviews line */}
      <path d={rPath} fill="none" stroke="#ff6b35" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={totalLen} strokeDashoffset={totalLen - drawn} />

      {/* Responses line */}
      <path d={sPth} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={totalLen} strokeDashoffset={totalLen - drawn} />

      {/* Dots */}
      {progress > 0.95 && reviewPts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill="#ff6b35" stroke="var(--bg-surface)" strokeWidth="2" />
      ))}
      {progress > 0.95 && responsePts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill="#22c55e" stroke="var(--bg-surface)" strokeWidth="2" />
      ))}
    </svg>
  );
}

// ── Horizontal bar ─────────────────────────────────────────────

function HBar({ label, count, max, color, progress, showStars = false }: {
  label: string; count: number; max: number; color: string; progress: number; showStars?: boolean;
}) {
  const pct = (count / max) * progress * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
      <div style={{ width: showStars ? 48 : 130, flexShrink: 0, fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'right' }}>
        {showStars
          ? <span style={{ color: '#f59e0b', fontSize: '14px' }}>{'★'.repeat(count as number)}</span>
          : label}
      </div>
      <div style={{ flex: 1, height: 10, background: 'var(--bg-hover)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 999, transition: 'none',
        }} />
      </div>
      <div style={{ width: 28, flexShrink: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left' }}>
        {count}
      </div>
    </div>
  );
}

// ── Section card ───────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)',
        fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)',
      }}>
        {title}
      </div>
      <div style={{ padding: '16px 20px' }}>
        {children}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────

export function Analytics() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const lineProgress = useAnimated(mounted, 900);
  const barProgress  = useAnimated(mounted, 700);

  const ratingMax    = Math.max(...RATINGS.map(r => r.count));
  const complaintMax = Math.max(...COMPLAINTS.map(c => c.count));

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 4px' }}>
          Analytics
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>
          Last 30 days · Pasta &amp; More
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 12 }}>
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Line chart */}
      <Section title="Response Rate Over Time">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ width: 24, height: 3, background: '#ff6b35', borderRadius: 2, display: 'inline-block' }} />
            Reviews received
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ width: 24, height: 3, background: '#22c55e', borderRadius: 2, display: 'inline-block' }} />
            Responses sent
          </span>
        </div>
        <LineChartSVG progress={lineProgress} />
      </Section>

      {/* Two-column row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Rating distribution */}
        <Section title="Rating Distribution">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {RATINGS.map(r => (
              <HBar
                key={r.stars}
                label={`${r.stars} star`}
                count={r.count}
                max={ratingMax}
                color={r.color}
                progress={barProgress}
                showStars
              />
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Total: {RATINGS.reduce((s, r) => s + r.count, 0)} reviews
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Avg: {(RATINGS.reduce((s, r) => s + r.stars * r.count, 0) / RATINGS.reduce((s, r) => s + r.count, 0)).toFixed(1)} ★
            </span>
          </div>
        </Section>

        {/* Top complaints */}
        <Section title="Top Complaint Categories">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {COMPLAINTS.map(c => (
              <HBar
                key={c.label}
                label={c.label}
                count={c.count}
                max={complaintMax}
                color={c.color}
                progress={barProgress}
              />
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Total complaints tracked: {COMPLAINTS.reduce((s, c) => s + c.count, 0)}
            </span>
          </div>
        </Section>
      </div>

      {/* Platform breakdown */}
      <Section title="Platform Breakdown">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Platform', 'Reviews', 'Response Rate', 'Avg Rating'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', fontSize: '11px', fontWeight: 600,
                  color: 'var(--text-tertiary)', textTransform: 'uppercase',
                  letterSpacing: '0.07em', padding: '0 12px 10px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLATFORMS.map((p, i) => (
              <tr key={p.name} style={{ background: i % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <td style={{ padding: '12px 12px 12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 12px 12px 0', fontSize: '13px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                  {p.reviews}
                </td>
                <td style={{ padding: '12px 12px 12px 0', minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg-hover)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width:  `${p.rate * barProgress}%`,
                        background: p.rate >= 75 ? '#22c55e' : p.rate >= 60 ? '#f59e0b' : '#ef4444',
                        borderRadius: 999,
                      }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', minWidth: 30, fontVariantNumeric: 'tabular-nums' }}>
                      {p.rate}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Stars rating={p.rating} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                      {p.rating.toFixed(1)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

    </div>
  );
}

export default Analytics;
