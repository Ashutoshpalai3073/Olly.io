import React, { useEffect, useState } from 'react';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  data:          DonutSegment[];
  size?:         number;
  thickness?:    number;
  centerLabel?:  React.ReactNode;
  showLegend?:   boolean;
  className?:    string;
  style?:        React.CSSProperties;
}

const GAP = 2.5;

export function DonutChart({
  data,
  size       = 160,
  thickness  = 28,
  centerLabel,
  showLegend = true,
  className  = '',
  style,
}: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const R  = (size - thickness) / 2 - 2;
  const circumference = 2 * Math.PI * R;

  let offset = 0;
  const segments = data.map((d, i) => {
    const frac = d.value / total;
    const len  = frac * circumference - GAP;
    const rot  = (offset / circumference) * 360 - 90;
    offset += frac * circumference;
    return { ...d, len, rot, idx: i };
  });

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 24, ...style }}>
      {/* SVG */}
      <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((s) => {
            const isHov = hovered === s.idx;
            return (
              <circle
                key={s.idx}
                cx={cx} cy={cy} r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={isHov ? thickness + 4 : thickness}
                strokeDasharray={`${mounted ? s.len : 0} ${circumference}`}
                strokeDashoffset={0}
                strokeLinecap="butt"
                transform={`rotate(${s.rot} ${cx} ${cy})`}
                style={{
                  transition: `stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1) ${s.idx * 0.08}s, stroke-width 0.15s`,
                  cursor: 'pointer',
                  opacity: hovered !== null && !isHov ? 0.55 : 1,
                }}
                onMouseEnter={() => setHovered(s.idx)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </svg>

        {/* Center text */}
        {centerLabel && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              pointerEvents: 'none',
              textAlign: 'center',
            }}
          >
            {hovered !== null ? (
              <>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {data[hovered].value}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', maxWidth: size * 0.55, lineHeight: 1.3 }}>
                  {data[hovered].label}
                </div>
              </>
            ) : (
              centerLabel
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {segments.map((s) => (
            <div
              key={s.idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'default',
                opacity: hovered !== null && hovered !== s.idx ? 0.45 : 1,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={() => setHovered(s.idx)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                style={{
                  width: 10, height: 10,
                  borderRadius: '50%',
                  background: s.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {s.label}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginLeft: 'auto', paddingLeft: 12 }}>
                {Math.round((s.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DonutChart;
