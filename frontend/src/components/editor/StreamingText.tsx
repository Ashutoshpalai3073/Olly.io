import React, { useEffect, useRef } from 'react';

const CURSOR_CSS = `
@keyframes olly-cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
.olly-cursor {
  display: inline-block;
  width: 2px;
  height: 1.1em;
  background: var(--accent-primary);
  vertical-align: text-bottom;
  border-radius: 1px;
  margin-left: 1px;
  animation: olly-cursor-blink 0.9s ease infinite;
}
`;

let cursorStyleInjected = false;
function ensureCursorStyle() {
  if (cursorStyleInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = CURSOR_CSS;
  document.head.appendChild(el);
  cursorStyleInjected = true;
}

export interface StreamingTextProps {
  value:       string;
  isStreaming: boolean;
  className?:  string;
  style?:      React.CSSProperties;
}

/**
 * Renders growing streamed text with a blinking cursor.
 * Directly updates the DOM text node (no React re-render per token)
 * so the textarea parent doesn't re-mount on each chunk.
 */
export function StreamingText({ value, isStreaming, className = '', style }: StreamingTextProps) {
  ensureCursorStyle();

  const textRef   = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  // Sync text content directly to DOM — bypasses React reconciliation
  useEffect(() => {
    if (textRef.current) {
      textRef.current.textContent = value;
    }
  }, [value]);

  // Show/hide cursor
  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.style.display = isStreaming ? 'inline-block' : 'none';
    }
  }, [isStreaming]);

  return (
    <span
      className={className}
      style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', ...style }}
    >
      <span ref={textRef}>{value}</span>
      <span ref={cursorRef} className="olly-cursor" aria-hidden />
    </span>
  );
}

export default StreamingText;
