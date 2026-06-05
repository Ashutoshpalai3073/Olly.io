import React, { useEffect, useState } from 'react';

export interface StarRatingProps {
  value: number;
  max?: number;
  size?: number;
  animate?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function StarRating({
  value,
  max = 5,
  size = 16,
  animate = true,
  className = '',
  style,
}: StarRatingProps) {
  const [filled, setFilled] = useState(animate ? 0 : value);

  useEffect(() => {
    if (!animate) { setFilled(value); return; }
    let current = 0;
    const step = value / 20;
    const id = setInterval(() => {
      current = Math.min(current + step, value);
      setFilled(current);
      if (current >= value) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [value, animate]);

  const STAR_PATH =
    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 1, ...style }}
      role="img"
      aria-label={`${value} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => {
        const starVal = i + 1;
        const isFull = filled >= starVal;
        const isHalf = !isFull && filled >= starVal - 0.5;
        const clipPercent = isFull ? 0 : isHalf ? 50 : 100;

        return (
          <span
            key={i}
            style={{ position: 'relative', display: 'inline-flex', width: size, height: size }}
          >
            {/* Empty background star */}
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
              <path
                d={STAR_PATH}
                fill="var(--bg-active)"
                stroke="var(--border-default)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            {/* Filled star (clipped) */}
            {clipPercent < 100 && (
              <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  clipPath: `inset(0 ${clipPercent}% 0 0)`,
                }}
              >
                <path
                  d={STAR_PATH}
                  fill="#f59e0b"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        );
      })}
    </span>
  );
}

export default StarRating;
