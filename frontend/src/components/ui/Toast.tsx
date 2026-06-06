import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Toast as ToastData } from '../../types';

export type { ToastData };

// Re-export variant type for backward compat
export type ToastVariant = ToastData['type'];

const CFG: Record<ToastVariant, { icon: React.ReactNode; color: string; iconBg: string; border: string }> = {
  success: {
    border: 'rgba(34,197,94,0.25)',
    iconBg: 'rgba(34,197,94,0.15)',
    color:  '#22c55e',
    icon:   (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
  error: {
    border: 'rgba(239,68,68,0.25)',
    iconBg: 'rgba(239,68,68,0.15)',
    color:  '#ef4444',
    icon:   (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
  },
  warning: {
    border: 'rgba(245,158,11,0.25)',
    iconBg: 'rgba(245,158,11,0.15)',
    color:  '#f59e0b',
    icon:   (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  info: {
    border: 'rgba(59,130,246,0.25)',
    iconBg: 'rgba(59,130,246,0.15)',
    color:  '#3b82f6',
    icon:   (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
};

export interface ToastProps {
  toast:     ToastData;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const { id, type, message, description, duration = 4000, action } = toast;
  const cfg = CFG[type];

  useEffect(() => {
    if (duration <= 0) return;
    const t = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(t);
  }, [id, duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,   scale: 1    }}
      exit={{    opacity: 0, y: 6,   scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        display:      'flex',
        alignItems:   description || action ? 'flex-start' : 'center',
        gap:          10,
        padding:      '10px 14px',
        background:   'var(--bg-elevated)',
        border:       `1px solid ${cfg.border}`,
        borderRadius: 'var(--radius-md)',
        boxShadow:    'var(--shadow-elevated)',
        minWidth:     260,
        maxWidth:     400,
        pointerEvents: 'all',
        userSelect:   'none',
      }}
    >
      {/* Variant icon */}
      <span
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          width:          22,
          height:         22,
          borderRadius:   '50%',
          background:     cfg.iconBg,
          color:          cfg.color,
          flexShrink:     0,
          marginTop:      description ? 1 : 0,
        }}
      >
        {cfg.icon}
      </span>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.45, fontWeight: 500 }}>
          {message}
        </div>
        {description && (
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: 2, lineHeight: 1.4 }}>
            {description}
          </div>
        )}
        {action && (
          <button
            onClick={action.onClick}
            style={{
              marginTop:    6,
              padding:      '3px 10px',
              fontSize:     '12px',
              fontFamily:   'inherit',
              fontWeight:   600,
              color:        cfg.color,
              background:   cfg.iconBg,
              border:       `1px solid ${cfg.border}`,
              borderRadius: 'var(--radius-sm)',
              cursor:       'pointer',
            }}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(id)}
        aria-label="Dismiss"
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          width:          20,
          height:         20,
          borderRadius:   'var(--radius-sm)',
          background:     'transparent',
          color:          'var(--text-tertiary)',
          fontSize:       '17px',
          cursor:         'pointer',
          border:         'none',
          padding:        0,
          fontFamily:     'inherit',
          flexShrink:     0,
          lineHeight:     1,
          marginTop:      description ? 1 : 0,
          transition:     'color var(--transition-fast)',
        }}
      >
        ×
      </button>
    </motion.div>
  );
}

export default Toast;
