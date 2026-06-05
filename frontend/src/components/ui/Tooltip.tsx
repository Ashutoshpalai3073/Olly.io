import React, { useState, useRef, useEffect } from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

interface Coords {
  centerX: number;
  triggerTop: number;
  triggerBottom: number;
}

export function Tooltip({ content, children, delay = 500, className = '', style }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [above, setAbove] = useState(true);
  const [coords, setCoords] = useState<Coords>({ centerX: 0, triggerTop: 0, triggerBottom: 0 });
  const wrapRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timerRef.current = setTimeout(() => {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      setAbove(r.top >= 80);
      setCoords({ centerX: r.left + r.width / 2, triggerTop: r.top, triggerBottom: r.bottom });
      setVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const positionStyle: React.CSSProperties = above
    ? { bottom: window.innerHeight - coords.triggerTop + 8, left: coords.centerX, transform: 'translateX(-50%)' }
    : { top: coords.triggerBottom + 8, left: coords.centerX, transform: 'translateX(-50%)' };

  return (
    <>
      <span
        ref={wrapRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        {children}
      </span>

      {visible && (
        <div
          role="tooltip"
          className={className}
          style={{
            position: 'fixed',
            zIndex: 2000,
            ...positionStyle,
            background: 'var(--bg-active)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: 500,
            padding: '5px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-elevated)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            ...style,
          }}
        >
          {content}
          {/* Arrow */}
          <span
            style={{
              position: 'absolute',
              [above ? 'bottom' : 'top']: -4,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 6,
              height: 6,
              background: 'var(--bg-active)',
              borderRight: above ? '1px solid var(--border-default)' : 'none',
              borderBottom: above ? '1px solid var(--border-default)' : 'none',
              borderLeft: above ? 'none' : '1px solid var(--border-default)',
              borderTop: above ? 'none' : '1px solid var(--border-default)',
              pointerEvents: 'none',
            }}
          />
        </div>
      )}
    </>
  );
}

export default Tooltip;
