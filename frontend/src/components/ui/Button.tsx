import React, { useState } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const BASE: Record<string, React.CSSProperties> = {
  primary:   { background: 'var(--accent-primary)', color: '#fff',                    border: '1px solid transparent'                           },
  secondary: { background: 'var(--bg-elevated)',    color: 'var(--text-primary)',      border: '1px solid var(--border-default)'                  },
  ghost:     { background: 'transparent',           color: 'var(--text-secondary)',    border: '1px solid transparent'                           },
  danger:    { background: 'rgba(239,68,68,0.12)',  color: 'var(--red)',               border: '1px solid rgba(239,68,68,0.25)'                   },
};

const HOVER: Record<string, React.CSSProperties> = {
  primary:   { background: 'var(--accent-hover)', transform: 'translateY(-1px)', boxShadow: '0 4px 14px rgba(255,107,53,0.35)' },
  secondary: { background: 'var(--bg-hover)',     borderColor: 'var(--border-strong)'                                          },
  ghost:     { background: 'var(--bg-hover)',     color: 'var(--text-primary)'                                                 },
  danger:    { background: 'rgba(239,68,68,0.22)', transform: 'translateY(-1px)'                                               },
};

const SIZE: Record<string, React.CSSProperties> = {
  sm: { padding: '0 10px', fontSize: '12px', height: '30px', gap: '5px', borderRadius: 'var(--radius-sm)' },
  md: { padding: '0 14px', fontSize: '14px', height: '36px', gap: '7px', borderRadius: 'var(--radius-md)' },
  lg: { padding: '0 18px', fontSize: '15px', height: '42px', gap: '8px', borderRadius: 'var(--radius-lg)' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  children,
  className = '',
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const isDisabled = disabled || loading;

  const combinedStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
    fontWeight: 500,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled && !loading ? 0.45 : 1,
    transition: 'all var(--transition-base)',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    outline: 'none',
    position: 'relative',
    overflow: 'hidden',
    width: fullWidth ? '100%' : undefined,
    ...BASE[variant],
    ...SIZE[size],
    ...(hovered && !isDisabled ? HOVER[variant] : {}),
    ...style,
  };

  return (
    <button
      className={className}
      disabled={isDisabled}
      style={combinedStyle}
      aria-busy={loading}
      onMouseEnter={(e) => { setHovered(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); onMouseLeave?.(e); }}
      {...props}
    >
      {loading ? (
        <>
          <span style={{ visibility: 'hidden', display: 'contents' }}>
            {leftIcon && <span>{leftIcon}</span>}
            {children}
            {rightIcon && <span>{rightIcon}</span>}
          </span>
          <span
            className="skeleton"
            style={{ position: 'absolute', inset: 0, borderRadius: 'inherit' }}
          />
        </>
      ) : (
        <>
          {leftIcon && (
            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {leftIcon}
            </span>
          )}
          {children}
          {rightIcon && (
            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
}

export default Button;
