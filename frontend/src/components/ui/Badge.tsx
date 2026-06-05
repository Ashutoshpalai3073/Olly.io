import React from 'react';

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent';
  size?: 'sm' | 'md';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const VARIANT_CLASS: Record<string, string> = {
  default: 'badge badge-neutral',
  success: 'badge badge-green',
  warning: 'badge badge-yellow',
  error:   'badge badge-red',
  info:    'badge badge-blue',
  accent:  'badge badge-accent',
};

const DOT_COLOR: Record<string, string> = {
  default: 'var(--text-tertiary)',
  success: 'var(--green)',
  warning: 'var(--yellow)',
  error:   'var(--red)',
  info:    'var(--blue)',
  accent:  'var(--accent-primary)',
};

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  className = '',
  style,
}: BadgeProps) {
  return (
    <span
      className={`${VARIANT_CLASS[variant]} ${className}`}
      style={{
        fontSize: size === 'sm' ? '11px' : undefined,
        padding: size === 'sm' ? '1px 6px' : undefined,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            display: 'inline-block',
            width: size === 'sm' ? 5 : 6,
            height: size === 'sm' ? 5 : 6,
            borderRadius: '50%',
            backgroundColor: DOT_COLOR[variant],
            flexShrink: 0,
            marginRight: 2,
          }}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
