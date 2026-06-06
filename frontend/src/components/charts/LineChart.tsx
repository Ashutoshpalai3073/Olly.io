import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

export interface LineChartPoint {
  label: string;
  value: number;
}

export interface LineChartSeries {
  points: LineChartPoint[];
  color:  string;
  label:  string;
}

export interface LineChartProps {
  series:     LineChartSeries[];
  height?:    number;
  showGrid?:  boolean;
  showDots?:  boolean;
  animated?:  boolean;
  className?: string;
  style?:     React.CSSProperties;
}

const PAD = { top: 16, right: 16, bottom: 36, left: 44 };

function smooth(pts: [number, number][]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`;
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cpx = (x0 + x1) / 2;
    d += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

function niceMax(v: number): number {
  if (v === 0) return 5;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / mag) * mag;
}

export function LineChart({
  series,
  height  = 220,
  showGrid  = true,
  showDots  = true,
  animated  = true,
  className = '',
  style,
}: LineChartProps) {
  const uid         = useId().replace(/:/g, '');
  const svgRef      = useRef<SVGSVGElement>(null);
  const [w, setW]   = useState(600);
  const [revealed, setRevealed] = useState(!animated);
  const [tooltip, setTooltip]   = useState<{ x: number; y: number; label: string; vals: { label: string; value: number; color: string }[] } | null>(null);
  const [crossX, setCrossX]     = useState<number | null>(null);

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) setW(rect.width || 600);
    });
    if (svgRef.current) obs.observe(svgRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!animated) return;
    const t = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(t);
  }, [animated]);

  const innerW = w   - PAD.left - PAD.right;
  const innerH = height - PAD.top  - PAD.bottom;

  // Combine all series to find global max
  const allPoints = series.flatMap(s => s.points);
  const maxVal = niceMax(Math.max(...allPoints.map(p => p.value), 1));
  const labels = series[0]?.points.map(p => p.label) ?? [];
  const n      = labels.length;

  const xOf = (i: number) => n <= 1 ? PAD.left + innerW / 2 : PAD.left + (i / (n - 1)) * innerW;
  const yOf = (v: number) => PAD.top + innerH - (v / maxVal) * innerH;

  const gridLines = useMemo(() => {
    const count = 4;
    return Array.from({ length: count + 1 }, (_, i) => ({
      y:   yOf((i / count) * maxVal),
      val: Math.round((i / count) * maxVal),
    }));
  }, [maxVal, innerH, height]); // eslint-disable-line react-hooks/exhaustive-deps

  // X-axis label step: show at most 8 labels
  const labelStep = Math.max(1, Math.ceil(n / 8));

  // Computed path strings per series
  const seriesData = series.map(s => {
    const pts = s.points.map<[number, number]>((p, i) => [xOf(i), yOf(p.value)]);
    const pathD = smooth(pts);
    const areaD = pts.length > 0
      ? `${pathD} L ${pts[pts.length - 1][0]} ${PAD.top + innerH} L ${pts[0][0]} ${PAD.top + innerH} Z`
      : '';
    return { ...s, pts, pathD, areaD };
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left - PAD.left;
    if (mx < 0 || mx > innerW || n === 0) { setTooltip(null); setCrossX(null); return; }

    const idx = Math.round((mx / innerW) * (n - 1));
    const clamped = Math.max(0, Math.min(n - 1, idx));
    const cx = xOf(clamped);
    setCrossX(cx);
    setTooltip({
      x: cx,
      y: Math.min(...seriesData.map(s => s.pts[clamped]?.[1] ?? PAD.top)),
      label: labels[clamped] ?? '',
      vals: seriesData.map(s => ({
        label: s.label,
        value: s.points[clamped]?.value ?? 0,
        color: s.color,
      })),
    });
  };

  return (
    <div className={className} style={{ position: 'relative', width: '100%', ...style }}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        style={{ overflow: 'visible', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setTooltip(null); setCrossX(null); }}
      >
        <defs>
          {seriesData.map((s, si) => (
            <linearGradient key={si} id={`${uid}-area-${si}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={s.color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0}    />
            </linearGradient>
          ))}
        </defs>

        {/* Grid */}
        {showGrid && gridLines.map((gl, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={gl.y} x2={PAD.left + innerW} y2={gl.y}
              stroke="var(--border-subtle)" strokeWidth={1}
              strokeDasharray={i === 0 ? undefined : '3 4'}
            />
            <text
              x={PAD.left - 6} y={gl.y + 4}
              fontSize={10} fill="var(--text-tertiary)" textAnchor="end"
            >
              {gl.val}
            </text>
          </g>
        ))}

        {/* X labels */}
        {labels.map((lbl, i) => {
          if (i % labelStep !== 0 && i !== n - 1) return null;
          const short = lbl.slice(5); // strip year from YYYY-MM-DD
          return (
            <text
              key={i}
              x={xOf(i)} y={height - 6}
              fontSize={10} fill="var(--text-tertiary)" textAnchor="middle"
            >
              {short}
            </text>
          );
        })}

        {/* Crosshair */}
        {crossX !== null && (
          <line
            x1={crossX} y1={PAD.top} x2={crossX} y2={PAD.top + innerH}
            stroke="var(--border-default)" strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {/* Series */}
        {seriesData.map((s, si) => {
          const pathLen = svgRef.current
            ? (svgRef.current.querySelector<SVGPathElement>(`[data-series="${si}"]`)?.getTotalLength() ?? 2000)
            : 2000;

          return (
            <g key={si}>
              {/* Area fill */}
              <path d={s.areaD} fill={`url(#${uid}-area-${si})`} />

              {/* Line */}
              <path
                data-series={si}
                d={s.pathD}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                style={animated ? {
                  strokeDasharray:  pathLen,
                  strokeDashoffset: revealed ? 0 : pathLen,
                  transition: `stroke-dashoffset ${0.9 + si * 0.15}s cubic-bezier(0.4,0,0.2,1)`,
                } : undefined}
              />

              {/* Dots */}
              {showDots && s.pts.map(([px, py], i) => (
                <circle
                  key={i}
                  cx={px} cy={py} r={3}
                  fill={s.color}
                  style={{ opacity: revealed ? 1 : 0, transition: `opacity 0.3s ${0.7 + i * 0.02}s` }}
                />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position:   'absolute',
            top:        Math.max(4, tooltip.y - 10),
            left:       tooltip.x + 10,
            transform:  tooltip.x > w * 0.7 ? 'translateX(calc(-100% - 20px))' : undefined,
            background: 'var(--bg-elevated)',
            border:     '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding:    '8px 12px',
            fontSize:   '12px',
            boxShadow:  'var(--shadow-lg)',
            pointerEvents: 'none',
            zIndex:     20,
            minWidth:   90,
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
            {tooltip.label.slice(5)}
          </div>
          {tooltip.vals.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, flexShrink: 0 }} />
              <span>{v.label}:</span>
              <span style={{ fontWeight: 600, marginLeft: 'auto', paddingLeft: 8 }}>{v.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LineChart;
