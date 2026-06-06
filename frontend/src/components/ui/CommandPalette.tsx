import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useReviewStore } from '../../store';

// ── Types ──────────────────────────────────────────────────────

interface Command {
  id:       string;
  label:    string;
  icon:     React.ReactNode;
  group:    string;
  onSelect: () => void;
}

// ── Fuzzy match ────────────────────────────────────────────────

function fuzzyMatch(query: string, text: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const result: React.ReactNode[] = [];
  let ti = 0;
  let qi = 0;

  while (ti < text.length) {
    if (qi < q.length && t[ti] === q[qi]) {
      result.push(
        <mark key={ti} style={{ background: 'var(--accent-muted)', color: 'var(--accent-primary)', borderRadius: 2 }}>
          {text[ti]}
        </mark>
      );
      qi++;
    } else {
      result.push(text[ti]);
    }
    ti++;
  }
  return result;
}

// ── Icons ──────────────────────────────────────────────────────

const IcoDash  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const IcoQueue = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IcoChart = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IcoGear  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IcoStar  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

// ── Props ──────────────────────────────────────────────────────

export interface CommandPaletteProps {
  open:    boolean;
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate     = useNavigate();
  const reviews      = useReviewStore(s => s.reviews);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) { setQuery(''); setCursor(0); setTimeout(() => inputRef.current?.focus(), 20); }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  const staticCommands = useMemo<Command[]>(() => [
    { id: 'dashboard', label: 'Go to Dashboard',    icon: <IcoDash />,  group: 'Navigate', onSelect: () => { navigate('/dashboard');  onClose(); } },
    { id: 'queue',     label: 'Go to Review Queue',  icon: <IcoQueue />, group: 'Navigate', onSelect: () => { navigate('/queue');     onClose(); } },
    { id: 'analytics', label: 'Go to Analytics',     icon: <IcoChart />, group: 'Navigate', onSelect: () => { navigate('/analytics'); onClose(); } },
    { id: 'settings',  label: 'Go to Settings',      icon: <IcoGear />,  group: 'Navigate', onSelect: () => { navigate('/settings');  onClose(); } },
  ], [navigate, onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  const recentCommands = useMemo<Command[]>(() => {
    return reviews.slice(0, 5).map(r => ({
      id:      `review-${r.id}`,
      label:   `${r.reviewer_name ?? 'Anonymous'} · ${r.rating}★ on ${r.platform}`,
      icon:    <IcoStar />,
      group:   'Recent reviews',
      onSelect: () => { navigate(`/editor/${r.id}`); onClose(); },
    }));
  }, [reviews, navigate, onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  const allCommands = [...staticCommands, ...recentCommands];

  const filtered = useMemo(
    () => allCommands.filter(c => fuzzyMatch(query, c.label)),
    [query, allCommands], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Clamp cursor
  useEffect(() => {
    setCursor(c => Math.min(c, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); filtered[cursor]?.onSelect(); }
  };

  // Group filtered commands
  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const cmd of filtered) {
      const group = map.get(cmd.group) ?? [];
      group.push(cmd);
      map.set(cmd.group, group);
    }
    return [...map.entries()];
  }, [filtered]);

  let globalIdx = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cp-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '14vh',
          }}
        >
          <motion.div
            key="cp-panel"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.95, y: -8  }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: 560, maxWidth: 'calc(100vw - 32px)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-modal)',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Search input */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setCursor(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search commands, reviews…"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'inherit',
                }}
              />
              <kbd style={{
                fontSize: '10px', fontFamily: 'inherit', fontWeight: 600,
                background: 'var(--bg-active)', border: '1px solid var(--border-default)',
                borderRadius: 4, padding: '2px 5px', color: 'var(--text-tertiary)',
              }}>
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 360, overflowY: 'auto', padding: '6px 0' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '20px 16px', fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  No commands found
                </div>
              ) : (
                grouped.map(([group, cmds]) => (
                  <div key={group}>
                    <div style={{
                      padding: '4px 16px 2px',
                      fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.06em', color: 'var(--text-tertiary)',
                    }}>
                      {group}
                    </div>
                    {cmds.map(cmd => {
                      globalIdx++;
                      const isActive = cursor === globalIdx;
                      const idx = globalIdx; // capture for closure
                      return (
                        <div
                          key={cmd.id}
                          onMouseEnter={() => setCursor(idx)}
                          onClick={cmd.onSelect}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 16px', cursor: 'pointer',
                            background: isActive ? 'var(--bg-active)' : 'transparent',
                            transition: 'background var(--transition-fast)',
                          }}
                        >
                          <span style={{
                            width: 26, height: 26, borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-active)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-secondary)', flexShrink: 0,
                          }}>
                            {cmd.icon}
                          </span>
                          <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                            {highlight(cmd.label, query)}
                          </span>
                          {isActive && (
                            <kbd style={{
                              marginLeft: 'auto', fontSize: '10px', fontFamily: 'inherit',
                              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                              borderRadius: 4, padding: '2px 5px', color: 'var(--text-tertiary)',
                            }}>↵</kbd>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div style={{
              borderTop: '1px solid var(--border-subtle)',
              padding: '7px 16px',
              display: 'flex', gap: 12,
              fontSize: '10px', color: 'var(--text-tertiary)',
            }}>
              {[['↑↓', 'navigate'], ['↵', 'select'], ['esc', 'close']].map(([key, desc]) => (
                <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <kbd style={{
                    background: 'var(--bg-active)', border: '1px solid var(--border-subtle)',
                    borderRadius: 3, padding: '1px 4px', fontFamily: 'inherit',
                  }}>{key}</kbd>
                  {desc}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
