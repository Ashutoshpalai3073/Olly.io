import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastProps extends ToastData {
  onDismiss: (id: string) => void;
}

const VARIANT_CFG: Record<
  ToastVariant,
  { icon: string; color: string; iconBg: string; border: string }
> = {
  success: { icon: '✓', color: 'var(--green)',  iconBg: 'rgba(34,197,94,0.15)',   border: 'rgba(34,197,94,0.25)'   },
  error:   { icon: '✕', color: 'var(--red)',    iconBg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.25)'   },
  info:    { icon: 'i', color: 'var(--blue)',   iconBg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.25)'  },
  warning: { icon: '!', color: 'var(--yellow)', iconBg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.25)'  },
};

export function Toast({ id, message, variant = 'info', duration = 4000, onDismiss }: ToastProps) {
  useEffect(() => {
    if (duration <= 0) return;
    const t = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(t);
  }, [id, duration, onDismiss]);

  const cfg = VARIANT_CFG[variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: 8,  scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        background: 'var(--bg-elevated)',
        border: `1px solid ${cfg.border}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-elevated)',
        minWidth: 260,
        maxWidth: 380,
        pointerEvents: 'all',
        userSelect: 'none',
      }}
    >
      {/* Variant icon */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: cfg.iconBg,
          color: cfg.color,
          fontSize: '11px',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {cfg.icon}
      </span>

      {/* Message */}
      <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.45 }}>
        {message}
      </span>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(id)}
        aria-label="Dismiss"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 20,
          height: 20,
          borderRadius: 'var(--radius-sm)',
          background: 'transparent',
          color: 'var(--text-tertiary)',
          fontSize: '16px',
          cursor: 'pointer',
          border: 'none',
          padding: 0,
          fontFamily: 'inherit',
          flexShrink: 0,
          lineHeight: 1,
          transition: 'color var(--transition-fast)',
        }}
      >
        ×
      </button>
    </motion.div>
  );
}

export default Toast;
