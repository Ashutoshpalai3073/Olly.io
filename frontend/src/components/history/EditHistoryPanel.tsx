import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponseStore } from '../../store';
import type { DBResponse } from '../../lib/supabase';

// ── Simple word-level diff ──────────────────────────────────────
type DiffToken = { type: 'same' | 'add' | 'remove'; text: string };

function wordDiff(oldText: string, newText: string): DiffToken[] {
  const oldW = oldText.split(/(\s+)/);
  const newW = newText.split(/(\s+)/);
  const m = oldW.length, n = newW.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = oldW[i-1] === newW[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);

  const result: DiffToken[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldW[i-1] === newW[j-1]) {
      result.unshift({ type: 'same', text: oldW[i-1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      result.unshift({ type: 'add',    text: newW[j-1] });
      j--;
    } else {
      result.unshift({ type: 'remove', text: oldW[i-1] });
      i--;
    }
  }
  return result;
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400)return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function excerpt(text: string, n = 50): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  return trimmed.length > n ? trimmed.slice(0, n) + '…' : trimmed;
}

function getActionLabel(v: DBResponse): string {
  const last = v.edit_history?.[v.edit_history.length - 1];
  if (last?.action) return last.action;
  if (v.version === 1) return 'AI Generated';
  return `Version ${v.version}`;
}

export interface EditHistoryPanelProps {
  reviewId: string;
}

export function EditHistoryPanel({ reviewId: _reviewId }: EditHistoryPanelProps) {
  const { versions, currentResponse, setContent, undoStack } = useResponseStore();

  const [compareA,    setCompareA]    = useState<string | null>(null);
  const [compareB,    setCompareB]    = useState<string | null>(null);
  const [diffMode,    setDiffMode]    = useState<'inline' | 'side-by-side'>('inline');
  const [showDiff,    setShowDiff]    = useState(false);
  const [confirmId,   setConfirmId]   = useState<string | null>(null);

  const handleRestore = useCallback((version: DBResponse) => {
    if (version.id === currentResponse?.id) return;
    const hasUnsaved = undoStack.length > 0;
    if (hasUnsaved) {
      setConfirmId(version.id);
    } else {
      setContent(version.content);
    }
  }, [currentResponse, undoStack, setContent]);

  const confirmRestore = useCallback(() => {
    if (!confirmId) return;
    const v = versions.find(x => x.id === confirmId);
    if (v) setContent(v.content);
    setConfirmId(null);
  }, [confirmId, versions, setContent]);

  const handleCompare = useCallback((versionId: string) => {
    if (!compareA) {
      setCompareA(versionId);
    } else if (!compareB && versionId !== compareA) {
      setCompareB(versionId);
      setShowDiff(true);
    } else {
      setCompareA(versionId);
      setCompareB(null);
      setShowDiff(false);
    }
  }, [compareA, compareB]);

  const closeDiff = () => { setCompareA(null); setCompareB(null); setShowDiff(false); };

  const vA = versions.find(v => v.id === compareA);
  const vB = versions.find(v => v.id === compareB);

  if (!versions.length) {
    return (
      <div style={{ padding: '12px 0', textAlign: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No versions yet</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          History
        </span>
        {compareA && (
          <button type="button" onClick={closeDiff} style={{
            fontSize: '11px', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}>
            Clear compare
          </button>
        )}
      </div>

      {/* Version list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <AnimatePresence initial={false}>
          {[...versions].reverse().map((v, idx) => {
            const isCurrent  = v.id === currentResponse?.id;
            const isCompA    = v.id === compareA;
            const isCompB    = v.id === compareB;
            const isSelected = isCompA || isCompB;

            return (
              <motion.div
                key={v.id}
                initial={idx === 0 ? { opacity: 0, y: -8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: isCurrent
                    ? '1px solid var(--accent-border)'
                    : isSelected
                    ? '1px solid rgba(59,130,246,0.3)'
                    : '1px solid var(--border-subtle)',
                  background: isCurrent
                    ? 'var(--accent-muted)'
                    : isSelected
                    ? 'rgba(59,130,246,0.06)'
                    : 'var(--bg-elevated)',
                  cursor: isCurrent ? 'default' : 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                  onClick={() => !isCurrent && handleRestore(v)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 600,
                      color: isCurrent ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}>
                      {getActionLabel(v)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {timeAgo(v.updated_at)}
                      </span>
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); handleCompare(v.id); }}
                          style={{
                            fontSize: '10px', fontFamily: 'inherit', fontWeight: 500,
                            padding: '1px 6px', borderRadius: '999px', cursor: 'pointer',
                            border: isSelected ? '1px solid rgba(59,130,246,0.4)' : '1px solid var(--border-subtle)',
                            background: isSelected ? 'rgba(59,130,246,0.1)' : 'transparent',
                            color: isSelected ? '#60a5fa' : 'var(--text-tertiary)',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          {isCompA ? 'A' : isCompB ? 'B' : 'Compare'}
                        </button>
                      )}
                      {isCurrent && (
                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '999px', background: 'var(--accent-muted)', color: 'var(--accent-primary)', border: '1px solid var(--accent-border)' }}>
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                    {excerpt(v.content)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirm restore */}
      <AnimatePresence>
        {confirmId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: 8, fontWeight: 500 }}>
              Restore this version? Unsaved changes will be lost.
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={confirmRestore} style={actionBtnStyle('danger')}>Restore</button>
              <button type="button" onClick={() => setConfirmId(null)} style={actionBtnStyle('ghost')}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diff view */}
      <AnimatePresence>
        {showDiff && vA && vB && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: 8, borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              overflow: 'hidden',
            }}>
              {/* Diff toolbar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 10px',
                background: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Comparing versions
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['inline', 'side-by-side'] as const).map(mode => (
                    <button key={mode} type="button" onClick={() => setDiffMode(mode)} style={{
                      fontSize: '11px', fontFamily: 'inherit', padding: '2px 8px', borderRadius: '999px', cursor: 'pointer',
                      border: diffMode === mode ? '1px solid var(--accent-border)' : '1px solid var(--border-subtle)',
                      background: diffMode === mode ? 'var(--accent-muted)' : 'transparent',
                      color: diffMode === mode ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                      transition: 'all var(--transition-fast)',
                      textTransform: 'capitalize',
                    }}>
                      {mode.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Diff content */}
              <div style={{ padding: 10, background: 'var(--bg-surface)' }}>
                {diffMode === 'inline'
                  ? <InlineDiff oldText={vA.content} newText={vB.content} />
                  : <SideBySideDiff oldText={vA.content} newText={vB.content} oldLabel={getActionLabel(vA)} newLabel={getActionLabel(vB)} />
                }
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InlineDiff({ oldText, newText }: { oldText: string; newText: string }) {
  const tokens = wordDiff(oldText, newText);
  return (
    <div style={{ fontSize: '12px', lineHeight: 1.8, fontFamily: "'Geist Mono', monospace", wordBreak: 'break-word' }}>
      {tokens.map((t, i) => (
        <span key={i} style={{
          background:
            t.type === 'add'    ? 'rgba(34,197,94,0.18)'  :
            t.type === 'remove' ? 'rgba(239,68,68,0.18)'  : 'transparent',
          color:
            t.type === 'add'    ? 'var(--green)' :
            t.type === 'remove' ? 'var(--red)'   : 'var(--text-secondary)',
          textDecoration: t.type === 'remove' ? 'line-through' : 'none',
          borderRadius: 2,
          padding: t.type !== 'same' ? '0 1px' : 0,
        }}>
          {t.text}
        </span>
      ))}
    </div>
  );
}

function SideBySideDiff({ oldText, newText, oldLabel, newLabel }: { oldText: string; newText: string; oldLabel: string; newLabel: string }) {
  const tokens = wordDiff(oldText, newText);
  const oldTokens = tokens.filter(t => t.type !== 'add');
  const newTokens = tokens.filter(t => t.type !== 'remove');

  const renderTokens = (toks: DiffToken[], highlight: 'add' | 'remove') =>
    toks.map((t, i) => (
      <span key={i} style={{
        background: t.type === highlight ? (highlight === 'add' ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)') : 'transparent',
        color: t.type === highlight ? (highlight === 'add' ? 'var(--green)' : 'var(--red)') : 'var(--text-secondary)',
        borderRadius: 2, padding: t.type !== 'same' ? '0 1px' : 0,
      }}>
        {t.text}
      </span>
    ));

  const cellStyle: React.CSSProperties = {
    flex: 1, padding: '8px', fontSize: '12px', lineHeight: 1.8,
    fontFamily: "'Geist Mono', monospace", wordBreak: 'break-word',
    minWidth: 0,
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={cellStyle}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          {oldLabel}
        </div>
        {renderTokens(oldTokens, 'remove')}
      </div>
      <div style={{ width: 1, background: 'var(--border-subtle)', flexShrink: 0 }} />
      <div style={cellStyle}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          {newLabel}
        </div>
        {renderTokens(newTokens, 'add')}
      </div>
    </div>
  );
}

function actionBtnStyle(variant: 'danger' | 'ghost'): React.CSSProperties {
  return {
    padding: '4px 10px', borderRadius: 'var(--radius-sm)',
    fontSize: '12px', fontWeight: 500, fontFamily: 'inherit',
    cursor: 'pointer', border: 'none',
    background: variant === 'danger' ? 'rgba(239,68,68,0.15)' : 'var(--bg-hover)',
    color: variant === 'danger' ? 'var(--red)' : 'var(--text-secondary)',
    transition: 'all var(--transition-fast)',
  };
}

export default EditHistoryPanel;
