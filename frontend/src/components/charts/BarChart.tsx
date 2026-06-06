import React, { useEffect, useState } from 'react';

export interface BarChartItem {
  label:  string;
  value:  number;
  color?: string;
}

export interface BarChartProps {
  data:       BarChartItem[];
  maxValue?:  number;
  barHeight?: number;
  gap?:       number;
  valueFormatter?: (v: number) => string;
  className?: string;
  style?:     React.CSSProperties;
}

const DEFAULT_COLOR = 'var(--accent-primary)';

export function BarChart({
  data,
  maxValue,
  barHeight = 28,
  gap       = 10,
  valueFormatter = (v) => String(v),
  className = '',
  style,
}: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const effectiveMax = maxValue ?? Math.max(...data.map(d => d.value), 1);
  const labelWidth   = Math.min(160, Math.max(...data.map(d => d.label.length)) * 7 + 8);

  if (data.length === 0) {
    return (
      <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', padding: '16px 0' }}>
        No data
      </div>
    );
  }

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>
      {data.map((item, i) => {
        const pct     = effectiveMax > 0 ? (item.value / effectiveMax) * 100 : 0;
        const isHov   = hovered === i;
        const color   = item.color ?? DEFAULT_COLOR;

        return (
          <div
            key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Category label */}
            <div
              style={{
                width:    labelWidth,
                flexShrink: 0,
                fontSize: '12px',
                color:    'var(--text-secondary)',
                textAlign: 'right',
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={item.label}
            >
              {item.label}
            </div>

            {/* Bar track */}
            <div
              style={{
                flex:         1,
                height:       barHeight,
                background:   'var(--bg-active)',
                borderRadius: 'var(--radius-sm)',
                overflow:     'hidden',
                position:     'relative',
              }}
            >
              <div
                style={{
                  position:     'absolute',
                  left:         0,
                  top:          0,
                  bottom:       0,
                  width:        mounted ? `${pct}%` : '0%',
                  background:   isHov ? `${color}e6` : color,
                  borderRadius: 'var(--radius-sm)',
                  transition:   `width 0.55s cubic-bezier(0.4,0,0.2,1) ${i * 0.05}s, background 0.12s`,
                  opacity:      isHov ? 1 : 0.85,
                }}
              />
            </div>

            {/* Value label */}
            <div
              style={{
                width:      40,
                flexShrink: 0,
                fontSize:   '12px',
                fontWeight: 600,
                color:      'var(--text-primary)',
                textAlign:  'left',
              }}
            >
              {valueFormatter(item.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BarChart;
