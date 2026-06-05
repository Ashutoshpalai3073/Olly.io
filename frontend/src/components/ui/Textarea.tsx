import React, { forwardRef, useRef, useEffect, useState } from 'react';

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  helperText?: string;
  error?: string;
  showCharCount?: boolean;
  autoResize?: boolean;
  monospace?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    helperText,
    error,
    showCharCount,
    maxLength,
    autoResize = false,
    monospace = false,
    value,
    defaultValue,
    className = '',
    style,
    id,
    onFocus,
    onBlur,
    onChange,
    rows = 4,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? ''));
  const innerRef = useRef<HTMLTextAreaElement | null>(null);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? String(value ?? '') : internalValue;
  const hasError = Boolean(error);

  const inputId = id ?? (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  useEffect(() => {
    if (!autoResize || !innerRef.current) return;
    innerRef.current.style.height = 'auto';
    innerRef.current.style.height = `${innerRef.current.scrollHeight}px`;
  }, [currentValue, autoResize]);

  const setRefs = (el: HTMLTextAreaElement | null) => {
    innerRef.current = el;
    if (typeof ref === 'function') {
      ref(el);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
    }
  };

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

      <textarea
        ref={setRefs}
        id={inputId}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        rows={rows}
        className={className}
        style={{
          width: '100%',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          border: `1px solid ${hasError ? 'var(--red)' : focused ? 'var(--accent-primary)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-md)',
          fontSize: '14px',
          padding: '10px 12px',
          outline: 'none',
          transition: 'border-color var(--transition-base), box-shadow var(--transition-base)',
          boxShadow: focused ? '0 0 0 3px var(--accent-muted)' : 'none',
          fontFamily: monospace ? "'Geist Mono', ui-monospace, monospace" : 'inherit',
          resize: autoResize ? 'none' : 'vertical',
          lineHeight: 1.6,
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

export default Textarea;
