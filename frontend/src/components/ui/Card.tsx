import React, { useState } from 'react';

export interface CardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const PAD = { sm: '12px', md: '20px', lg: '28px' } as const;

export function Card({
  children,
  padding = 'md',
  hoverable = false,
  header,
  footer,
  className = '',
  style,
  onClick,
}: CardProps) {
  const [hovered, setHovered] = useState(false);
  const p = PAD[padding];

  return (
    <div
      className={`surface-elevated ${className}`}
      style={{
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
        ...(hoverable && hovered
          ? { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)' }
          : {}),
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {header && (
        <div style={{ padding: p, borderBottom: '1px solid var(--border-subtle)' }}>
          {header}
        </div>
      )}
      <div style={{ padding: p }}>
        {children}
      </div>
      {footer && (
        <div style={{ padding: p, borderTop: '1px solid var(--border-subtle)' }}>
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;
