import React, { useState } from 'react';

export interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  showValue?: boolean;
  minLabel?: React.ReactNode;
  maxLabel?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const SLIDER_CSS = `
.olly-slider {
  -webkit-appearance: none;
  appearance: none;
  position: relative;
  width: 100%;
  height: 20px;
  background: transparent;
  cursor: pointer;
  outline: none;
  z-index: 1;
}
.olly-slider:disabled { cursor: not-allowed; opacity: 0.5; }

.olly-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  box-shadow: 0 0 0 3px var(--bg-elevated), 0 0 0 5px var(--accent-border);
  transition: transform 150ms ease, box-shadow 150ms ease;
}
.olly-slider:not(:disabled)::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 0 0 3px var(--bg-elevated), 0 0 0 6px rgba(255,107,53,0.4);
}
.olly-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  border: none;
  box-shadow: 0 0 0 3px var(--bg-elevated), 0 0 0 5px var(--accent-border);
}
`;

let sliderStyleInjected = false;
function ensureSliderStyles() {
  if (sliderStyleInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = SLIDER_CSS;
  document.head.appendChild(el);
  sliderStyleInjected = true;
}

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue = 0,
  onChange,
  showValue = true,
  minLabel,
  maxLabel,
  disabled = false,
  className = '',
  style,
}: SliderProps) {
  ensureSliderStyles();

  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? (value as number) : internal;
  const pct = Math.max(0, Math.min(100, ((current - min) / (max - min)) * 100));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', ...style }}
    >
      {showValue && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent-primary)',
              background: 'var(--accent-muted)',
              border: '1px solid var(--accent-border)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              minWidth: 32,
              textAlign: 'center',
            }}
          >
            {current}
          </span>
        </div>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '2px 0' }}>
        {/* Track background */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 4,
            borderRadius: 2,
            background: 'var(--bg-active)',
            pointerEvents: 'none',
          }}
        />
        {/* Track fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: `${pct}%`,
            height: 4,
            borderRadius: 2,
            background: disabled ? 'var(--text-tertiary)' : 'var(--accent-primary)',
            pointerEvents: 'none',
            transition: 'width var(--transition-fast)',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          disabled={disabled}
          onChange={handleChange}
          className="olly-slider"
        />
      </div>

      {(minLabel !== undefined || maxLabel !== undefined) && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            {minLabel ?? min}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            {maxLabel ?? max}
          </span>
        </div>
      )}
    </div>
  );
}

export default Slider;
