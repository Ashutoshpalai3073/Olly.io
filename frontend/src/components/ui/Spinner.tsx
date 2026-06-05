import React from 'react';

export interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Spinner({ size = 16, color, className = '', style }: SpinnerProps) {
  return (
    <span
      className={`animate-spin ${className}`}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${color ?? 'currentColor'}`,
        borderTopColor: 'transparent',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export default Spinner;
