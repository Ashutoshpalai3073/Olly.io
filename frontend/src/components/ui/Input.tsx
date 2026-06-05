import React, { forwardRef, useState } from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showCharCount?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    error,
    leftIcon,
    rightIcon,
    showCharCount,
    maxLength,
    value,
    defaultValue,
    className = '',
    style,
    id,
    onFocus,
    onBlur,
    onChange,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? ''));
  const isControlled = value !== undefined;
  const currentValue = isControlled ? String(value ?? '') : internalValue;

  const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const hasError = Boolean(error);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: hasError ? 'var(--red)' : 'var(--text-secondary)',
            lineHeight: 1.4,
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: 10,
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-tertiary)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          className={className}
          style={{
            width: '100%',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: `1px solid ${hasError ? 'var(--red)' : focused ? 'var(--accent-primary)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            padding: `8px ${rightIcon ? '36px' : '12px'} 8px ${leftIcon ? '36px' : '12px'}`,
            outline: 'none',
            transition: 'border-color var(--transition-base), box-shadow var(--transition-base)',
            boxShadow: focused ? '0 0 0 3px var(--accent-muted)' : 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
            ...style,
          }}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); onBlur?.(e); }}
          onChange={(e) => {
            if (!isControlled) setInternalValue(e.target.value);
            onChange?.(e);
          }}
          {...rest}
        />

        {rightIcon && (
          <span
            style={{
              position: 'absolute',
              right: 10,
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-tertiary)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {rightIcon}
          </span>
        )}
      </div>

      {(error || helperText || (showCharCount && maxLength)) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          {(error || helperText) && (
            <span style={{ fontSize: '12px', color: error ? 'var(--red)' : 'var(--text-tertiary)', lineHeight: 1.4 }}>
              {error ?? helperText}
            </span>
          )}
          {showCharCount && maxLength && (
            <span
              style={{
                fontSize: '12px',
                color: currentValue.length >= maxLength ? 'var(--red)' : 'var(--text-tertiary)',
                marginLeft: 'auto',
                flexShrink: 0,
              }}
            >
              {currentValue.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

export default Input;
