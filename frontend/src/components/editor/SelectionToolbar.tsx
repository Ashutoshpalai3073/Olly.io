import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Spinner from '../ui/Spinner';

export interface SelectionAction {
  label: string;
  instruction: string;
}

export const SELECTION_ACTIONS: SelectionAction[] = [
  { label: '✦ Rephrase',     instruction: 'Rephrase this selection in a fresh way while keeping the meaning' },
  { label: 'Shorten',        instruction: 'Shorten this selection concisely' },
  { label: 'Lengthen',       instruction: 'Expand this selection with more helpful detail' },
  { label: 'Stronger',       instruction: 'Make this selection stronger and more emphatic' },
  { label: 'Softer',         instruction: 'Make this selection softer and more empathetic' },
  { label: 'More Formal',    instruction: 'Rewrite this selection in a more formal, professional tone' },
];

export interface SelectionToolbarProps {
  textareaRef:    React.RefObject<HTMLTextAreaElement>;
  selectionStart: number;
  selectionEnd:   number;
  selectedText:   string;
  visible:        boolean;
  loading:        boolean;
  onAction:       (action: SelectionAction, text: string, start: number, end: number) => void;
  onDelete:       (start: number, end: number) => void;
  onDismiss:      () => void;
}

function getSelectionCoords(
  textarea: HTMLTextAreaElement,
  start: number,
  end: number,
): { x: number; y: number } | null {
  if (start >= end) return null;

  const computed = window.getComputedStyle(textarea);
  const rect     = textarea.getBoundingClientRect();

  const mirror = document.createElement('div');
  mirror.style.cssText = [
    `position:fixed`,
    `top:${rect.top}px`,
    `left:${rect.left}px`,
    `width:${rect.width}px`,
    `height:${rect.height}px`,
    `overflow:hidden`,
    `visibility:hidden`,
    `pointer-events:none`,
    `white-space:pre-wrap`,
    `word-wrap:break-word`,
    `font-family:${computed.fontFamily}`,
    `font-size:${computed.fontSize}`,
    `font-weight:${computed.fontWeight}`,
    `line-height:${computed.lineHeight}`,
    `letter-spacing:${computed.letterSpacing}`,
    `padding:${computed.padding}`,
    `border:${computed.border}`,
    `box-sizing:${computed.boxSizing}`,
  ].join(';');

  const inner = document.createElement('div');
  inner.style.marginTop = `-${textarea.scrollTop}px`;

  inner.appendChild(document.createTextNode(textarea.value.slice(0, start)));

  const span = document.createElement('span');
  span.textContent = textarea.value.slice(start, end) || '​';
  inner.appendChild(span);

  mirror.appendChild(inner);
  document.body.appendChild(mirror);

  const spanRect = span.getBoundingClientRect();
  document.body.removeChild(mirror);

  return {
    x: spanRect.left + spanRect.width / 2,
    y: spanRect.top,
  };
}

const TOOLBAR_WIDTH = 368;
const TOOLBAR_HEIGHT = 38;
const GAP = 10;

export function SelectionToolbar({
  textareaRef,
  selectionStart,
  selectionEnd,
  selectedText,
  visible,
  loading,
  onAction,
  onDelete,
  onDismiss,
}: SelectionToolbarProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Recompute position when selection changes
  useEffect(() => {
    if (!visible || !textareaRef.current || selectionStart >= selectionEnd) {
      setPosition(null);
      return;
    }
    const coords = getSelectionCoords(textareaRef.current, selectionStart, selectionEnd);
    if (!coords) { setPosition(null); return; }

    // Clamp x within viewport
    const halfW = TOOLBAR_WIDTH / 2;
    const clampedX = Math.max(halfW + 8, Math.min(coords.x, window.innerWidth - halfW - 8));
    // If not enough room above, show below
    const above = coords.y - GAP - TOOLBAR_HEIGHT;
    const below = coords.y + TOOLBAR_HEIGHT + GAP + 4;
    const y = above >= 8 ? above : below;

    setPosition({ x: clampedX, y });
  }, [visible, selectionStart, selectionEnd, textareaRef]);

  // Dismiss on outside click
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible, onDismiss]);

  // Escape to dismiss
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, onDismiss]);

  if (!position) return null;

  const toolbar = (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={toolbarRef}
          key="selection-toolbar"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1,    opacity: 1 }}
          exit={{    scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          style={{
            position: 'fixed',
            left: position.x - TOOLBAR_WIDTH / 2,
            top: position.y,
            width: TOOLBAR_WIDTH,
            zIndex: 600,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-modal)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 4px',
            height: TOOLBAR_HEIGHT,
            gap: 0,
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', flex: 1 }}>
              <Spinner size={14} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Applying…</span>
            </div>
          ) : (
            <>
              {SELECTION_ACTIONS.map((action, i) => (
                <React.Fragment key={action.label}>
                  {i > 0 && i < SELECTION_ACTIONS.length && (
                    <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', flexShrink: 0 }} />
                  )}
                  <ToolbarBtn onClick={() => onAction(action, selectedText, selectionStart, selectionEnd)}>
                    {action.label}
                  </ToolbarBtn>
                </React.Fragment>
              ))}
              <div style={{ width: 1, height: 16, background: 'var(--border-default)', flexShrink: 0, margin: '0 2px' }} />
              <ToolbarBtn
                danger
                onClick={() => onDelete(selectionStart, selectionEnd)}
              >
                Delete
              </ToolbarBtn>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(toolbar, document.body);
}

function ToolbarBtn({
  children, onClick, danger = false,
}: {
  children: React.ReactNode; onClick: () => void; danger?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? (danger ? 'rgba(239,68,68,0.1)' : 'var(--bg-hover)') : 'transparent',
        border: 'none',
        color: danger
          ? hov ? 'var(--red)' : 'var(--text-tertiary)'
          : hov ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: '12px',
        fontWeight: 500,
        padding: '0 7px',
        height: '100%',
        cursor: 'pointer',
        borderRadius: 'var(--radius-sm)',
        transition: 'all var(--transition-fast)',
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

export default SelectionToolbar;
