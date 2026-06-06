import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useResponseStore } from '../../store';
import { useAutoSave } from '../../hooks/useAutoSave';
import Spinner from '../ui/Spinner';

const PLATFORM_LIMITS: Record<string, { label: string; limit: number }> = {
  google:      { label: 'Google',      limit: 4096 },
  zomato:      { label: 'Zomato',      limit: 1000 },
  swiggy:      { label: 'Swiggy',      limit: 500  },
  tripadvisor: { label: 'TripAdvisor', limit: 2000 },
};

type VersionState = 'ai_draft' | 'edited' | 'saved';

export interface ResponseEditorBoxProps {
  reviewId:           string;
  platform:           string;
  onSelectionChange?: (start: number, end: number, text: string) => void;
  textareaRef?:       React.RefObject<HTMLTextAreaElement>;
}

function formatTimeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 10) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  return mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
}

function IBtn({
  title, onClick, disabled, children,
}: {
  title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: 'var(--radius-sm)',
        border: 'none', padding: 0, flexShrink: 0,
        background: hov && !disabled ? 'var(--bg-hover)' : 'transparent',
        color: disabled ? 'var(--text-tertiary)' : hov ? 'var(--text-primary)' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.38 : 1,
        transition: 'all var(--transition-fast)',
      }}
    >
      {children}
    </button>
  );
}

export function ResponseEditorBox({
  reviewId,
  platform,
  onSelectionChange,
  textareaRef: externalRef,
}: ResponseEditorBoxProps) {
  const internalRef  = useRef<HTMLTextAreaElement>(null);
  const resolvedRef  = (externalRef ?? internalRef) as React.RefObject<HTMLTextAreaElement>;

  const {
    currentResponse, isGenerating, isEditing,
    isSaving, lastSaved, undoStack, redoStack,
    setContent, undo, redo, saveVersion,
  } = useResponseStore();

  const content     = currentResponse?.content ?? '';
  const [vState, setVState]       = useState<VersionState>('ai_draft');
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied]         = useState(false);
  const prevGenRef  = useRef(isGenerating);
  const prevContent = useRef(content);

  // After streaming finishes, mark as ai_draft; after manual edit, mark as edited
  useEffect(() => {
    if (prevGenRef.current && !isGenerating) {
      setVState('ai_draft');
    }
    prevGenRef.current = isGenerating;
  }, [isGenerating]);

  useEffect(() => {
    if (content !== prevContent.current) {
      prevContent.current = content;
      if (!isGenerating && !isEditing) setVState('edited');
    }
  }, [content, isGenerating, isEditing]);

  useEffect(() => {
    if (lastSaved) setVState('saved');
  }, [lastSaved]);

  // Auto-grow
  useEffect(() => {
    const ta = resolvedRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.max(220, ta.scrollHeight)}px`;
  }, [content, resolvedRef]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, [setContent]);

  const handleSelectionChange = useCallback(() => {
    const ta = resolvedRef.current;
    if (!ta || !onSelectionChange) return;
    onSelectionChange(ta.selectionStart, ta.selectionEnd, ta.value.slice(ta.selectionStart, ta.selectionEnd));
  }, [onSelectionChange, resolvedRef]);

  const saveFn = useCallback(async () => {
    if (!reviewId) return;
    await saveVersion(reviewId, 'Auto-save');
  }, [reviewId, saveVersion]);

  useAutoSave(content, saveFn, 3000);

  const platformInfo = PLATFORM_LIMITS[platform?.toLowerCase()] ?? null;
  const charLimit    = platformInfo?.limit ?? 4096;
  const charCount    = content.length;
  const wordCount    = content.trim() ? content.trim().split(/\s+/).length : 0;
  const pct          = Math.min(charCount / charLimit, 1);
  const limitColor   = pct < 0.7 ? 'var(--green)' : pct < 0.9 ? 'var(--yellow)' : 'var(--red)';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const badge = {
    ai_draft: { label: 'AI Draft', bg: 'rgba(59,130,246,0.14)',  color: '#60a5fa', border: 'rgba(59,130,246,0.28)' },
    edited:   { label: 'Edited',   bg: 'rgba(245,158,11,0.14)',  color: 'var(--yellow)', border: 'rgba(245,158,11,0.28)' },
    saved:    { label: 'Saved',    bg: 'rgba(34,197,94,0.14)',   color: 'var(--green)',  border: 'rgba(34,197,94,0.28)' },
  }[vState];

  const isLocked = isGenerating || isEditing;

  const wrap: React.CSSProperties = fullscreen
    ? { position: 'fixed', inset: 0, zIndex: 500, background: 'var(--bg-primary)', padding: 24, display: 'flex', flexDirection: 'column', gap: 0 }
    : { display: 'flex', flexDirection: 'column', gap: 0 };

  return (
    <div style={wrap}>
      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 12px', background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)', borderBottom: 'none',
        borderRadius: 'var(--radius-md) var(--radius-md) 0 0', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: '11px', fontWeight: 600, padding: '2px 8px',
            borderRadius: '999px', letterSpacing: '0.02em',
            background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
          }}>
            {badge.label}
          </span>
          <span style={{
            fontSize: '12px', fontVariantNumeric: 'tabular-nums',
            color: charCount > charLimit ? 'var(--red)' : 'var(--text-tertiary)',
            fontWeight: charCount > charLimit ? 600 : 400,
          }}>
            {charCount.toLocaleString()} chars
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>·</span>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
            {wordCount} words
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IBtn title="Undo (Ctrl+Z)" onClick={undo} disabled={undoStack.length === 0}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 .7-3.6"/>
            </svg>
          </IBtn>
          <IBtn title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={redoStack.length === 0}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 7v6h-6"/><path d="M21 13a9 9 0 1 1-.7-3.6"/>
            </svg>
          </IBtn>
          <div style={{ width: 1, height: 16, background: 'var(--border-default)', margin: '0 4px' }} />
          <IBtn title={copied ? 'Copied!' : 'Copy to clipboard'} onClick={handleCopy}>
            {copied
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
            }
          </IBtn>
          <IBtn title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={() => setFullscreen(f => !f)}>
            {fullscreen
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                  <path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                </svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
                  <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
                </svg>
            }
          </IBtn>
        </div>
      </div>

      {/* ── Char-limit bar ── */}
      <div style={{ height: 3, background: 'var(--bg-hover)', position: 'relative', flexShrink: 0 }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${pct * 100}%`, background: limitColor,
          transition: 'width 0.35s ease, background 0.35s ease',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      {/* ── Platform limit labels ── */}
      <div style={{
        display: 'flex', gap: 10, padding: '5px 12px',
        background: 'var(--bg-elevated)', flexShrink: 0,
        borderLeft: '1px solid var(--border-default)',
        borderRight: '1px solid var(--border-default)',
        alignItems: 'center',
      }}>
        {Object.entries(PLATFORM_LIMITS).map(([key, info]) => {
          const active   = key === platform?.toLowerCase();
          const pctLocal = active ? Math.min(charCount / info.limit, 1) : 0;
          const over     = active && charCount > info.limit;
          const accentC  = over ? 'var(--red)' : '#ff6b35';

          if (!active) {
            return (
              <span key={key} style={{
                fontSize: '11px', color: 'var(--text-tertiary)',
                letterSpacing: '0.01em',
              }}>
                {info.label} {info.limit.toLocaleString()}
              </span>
            );
          }

          return (
            <span key={key} style={{
              display: 'inline-flex', flexDirection: 'column', gap: 2,
              padding: '2px 7px', borderRadius: 'var(--radius-sm)',
              background: over ? 'rgba(239,68,68,0.10)' : 'rgba(255,107,53,0.10)',
              border: `1px solid ${over ? 'rgba(239,68,68,0.25)' : 'rgba(255,107,53,0.25)'}`,
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: accentC, letterSpacing: '0.01em' }}>
                  {info.label}
                </span>
                <span style={{
                  fontSize: '11px', fontVariantNumeric: 'tabular-nums',
                  color: over ? 'var(--red)' : 'var(--text-secondary)', fontWeight: 500,
                }}>
                  {charCount.toLocaleString()} / {info.limit.toLocaleString()}
                </span>
                {over && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--red)' }}>
                    over limit
                  </span>
                )}
              </span>
              {/* mini progress bar */}
              <div style={{ height: 2, background: 'var(--bg-hover)', borderRadius: 1, width: 80 }}>
                <div style={{
                  height: '100%',
                  width: `${pctLocal * 100}%`,
                  background: over ? 'var(--red)' : pctLocal > 0.9 ? 'var(--yellow)' : accentC,
                  borderRadius: 1,
                  transition: 'width 0.2s ease, background 0.2s ease',
                }} />
              </div>
            </span>
          );
        })}
      </div>

      {/* ── Textarea ── */}
      <div style={{ position: 'relative', flex: fullscreen ? 1 : undefined }}>
        {isGenerating && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            background: 'rgba(8,8,9,0.72)', backdropFilter: 'blur(2px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 10,
            borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          }}>
            <Spinner size={22} />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Olly is crafting your response…
            </span>
          </div>
        )}

        <textarea
          ref={resolvedRef}
          value={content}
          onChange={handleChange}
          onMouseUp={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          disabled={isLocked}
          spellCheck
          placeholder="Your response will appear here…"
          style={{
            width: '100%',
            minHeight: fullscreen ? undefined : '220px',
            height: fullscreen ? '100%' : undefined,
            padding: '16px 16px 36px',
            fontFamily: "'Geist Mono', 'Courier New', monospace",
            fontSize: '14px',
            lineHeight: 1.8,
            color: 'var(--text-primary)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '0 0 var(--radius-md) var(--radius-md)',
            resize: 'none',
            outline: 'none',
            display: 'block',
            boxSizing: 'border-box',
            transition: 'border-color var(--transition-base), box-shadow var(--transition-base)',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--accent-primary)';
            e.target.style.boxShadow   = '0 0 0 3px var(--accent-muted)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--border-default)';
            e.target.style.boxShadow   = 'none';
          }}
        />

        {/* Autosave indicator */}
        <div style={{
          position: 'absolute', bottom: 10, right: 12,
          fontSize: '11px', color: 'var(--text-tertiary)',
          display: 'flex', alignItems: 'center', gap: 4,
          pointerEvents: 'none', userSelect: 'none',
        }}>
          {isSaving
            ? <><Spinner size={10} /><span>Saving…</span></>
            : lastSaved
            ? <span>Saved {formatTimeAgo(lastSaved)}</span>
            : null}
        </div>
      </div>
    </div>
  );
}

export default ResponseEditorBox;
