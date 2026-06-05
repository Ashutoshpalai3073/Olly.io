import React from 'react';
import Button from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  className?: string;
  style?: React.CSSProperties;
}

export function EmptyState({ icon, title, description, action, className = '', style }: EmptyStateProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        gap: 12,
        ...style,
      }}
    >
      {icon && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-xl)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            marginBottom: 4,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      )}

      <h4
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        {title}
      </h4>

      {description && (
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-tertiary)',
            lineHeight: 1.55,
            maxWidth: 280,
            margin: 0,
          }}
        >
          {description}
        </p>
      )}

      {action && (
        <Button
          variant={action.variant ?? 'primary'}
          size="sm"
          onClick={action.onClick}
          style={{ marginTop: 4 }}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
