import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Toggle({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  label,
  className = '',
  style,
}: ToggleProps) {
  const [internal, setInternal] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isOn = isControlled ? (checked as boolean) : internal;

  const toggle = () => {
    if (disabled) return;
    const next = !isOn;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  return (
    <label
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
        ...style,
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        disabled={disabled}
        onClick={toggle}
        style={{
          position: 'relative',
          width: 42,
          height: 24,
          borderRadius: '999px',
          border: 'none',
          padding: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: isOn ? 'var(--accent-primary)' : 'var(--bg-active)',
          transition: 'background var(--transition-base)',
          outline: 'none',
          flexShrink: 0,
        }}
      >
        <motion.span
          animate={{ x: isOn ? 20 : 2 }}
          initial={false}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          style={{
            position: 'absolute',
            top: 2,
            display: 'block',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
          }}
        />
      </button>
      {label && (
        <span style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {label}
        </span>
      )}
    </label>
  );
}

export default Toggle;
