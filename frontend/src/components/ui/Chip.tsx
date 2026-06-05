import React, { useState } from 'react';
import Spinner from './Spinner';

export interface ChipProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
  active?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  style?: React.CSSProperties;
}

export function Chip({
  children,
  icon,
  loading = false,
  active = false,
  disabled = false,
  onClick,
  className = '',
  style,
}: ChipProps) {
  const [hovered, setHovered] = useState(false);
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        borderRadius: '999px',
        fontSize: '13px',
        fontWeight: 500,
        fontFamily: 'inherit',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all var(--transition-base)',
        outline: 'none',
        background: active
          ? 'var(--accent-muted)'
          : hovered
          ? 'var(--bg-hover)'
          : 'var(--bg-elevated)',
        color: active ? 'var(--accent-primary)' : hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
        border: active
          ? '1px solid var(--accent-border)'
          : '1px solid var(--border-default)',
        ...style,
      }}
      onMouseEnter={() => !isDisabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {loading ? (
        <Spinner size={12} />
      ) : icon ? (
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

export default Chip;
