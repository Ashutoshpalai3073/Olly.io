import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponseStore } from '../../store';
import type { ApplyPromptRequest, ReviewContext, BrandSettingsPayload } from '../../lib/api';
import Spinner from '../ui/Spinner';

const PLACEHOLDERS = [
  "Add a 15% discount offer…",
  "Remove the chef's name…",
  "Start with Hi instead of Dear…",
  "Add our Instagram handle…",
  "Shorten the second paragraph…",
];

const HINT_CHIPS = [
  { label: '+ Offer',            text: 'Add a special offer or discount to the response' },
  { label: '+ Contact',          text: 'Add our contact information to the response' },
  { label: '+ Social',           text: 'Add our social media links to the response' },
  { label: '+ Apology',          text: 'Add a sincere apology for the issue mentioned' },
  { label: '+ Reservation link', text: 'Add our reservation booking link to the response' },
  { label: '+ Emoji',            text: 'Add a few relevant emojis to make the response friendlier' },
];

export interface FreeformPromptBoxProps {
  review:        ReviewContext;
  brandSettings: BrandSettingsPayload;
}

export function FreeformPromptBox({ review, brandSettings }: FreeformPromptBoxProps) {
  const { currentResponse, isEditing, applyPrompt } = useResponseStore();

  const [text, setText]           = useState('');
  const [focused, setFocused]     = useState(false);
  const [phIdx, setPhIdx]         = useState(0);
  const [phVisible, setPhVisible] = useState(true);
  const [success, setSuccess]     = useState<string | null>(null);
  const textareaRef               = useRef<HTMLTextAreaElement>(null);

  // Cycle placeholder
  useEffect(() => {
    if (focused || text) return;
    const timer = setInterval(() => {
      setPhVisible(false);
      setTimeout(() => {
        setPhIdx(i => (i + 1) % PLACEHOLDERS.length);
        setPhVisible(true);
      }, 350);
    }, 3000);
    return () => clearInterval(timer);
  }, [focused, text]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const maxH = parseFloat(getComputedStyle(ta).lineHeight) * 4 + 32;
    ta.style.height = `${Math.min(ta.scrollHeight, maxH)}px`;
  }, [text]);

  const submit = useCallback(async () => {
    if (!text.trim() || !currentResponse || isEditing) return;

    const prompt = text.trim();
    setText('');

    const payload: ApplyPromptRequest = {
      content:       currentResponse.content,
      prompt,
      review,
      brandSettings,
    };

    await applyPrompt(payload);

    setSuccess(`Applied: "${prompt.length > 60 ? prompt.slice(0, 60) + '…' : prompt}"`);
    setTimeout(() => setSuccess(null), 4000);
  }, [text, currentResponse, isEditing, applyPrompt, review, brandSettings]);

  const handleKey = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }, [submit]);

  const insertHint = useCallback((hintText: string) => {
    setText(hintText);
    textareaRef.current?.focus();
  }, []);

  const showPlaceholder = !text && !focused;

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px 8px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{ fontSize: '13px', color: 'var(--accent-primary)', fontWeight: 600 }}>✦</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Ask Olly to change anything
        </span>
      </div>

      {/* Input area */}
      <div style={{ padding: '10px 14px 0', position: 'relative' }}>
        {/* Animated placeholder overlay */}
        {showPlaceholder && (
          <div
            style={{
              position: 'absolute',
              top: 22,
              left: 14,
              right: 48,
              pointerEvents: 'none',
              fontSize: '13px',
              color: 'var(--text-tertiary)',
              lineHeight: 1.6,
              opacity: phVisible ? 1 : 0,
              transition: 'opacity 0.3s ease',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {PLACEHOLDERS[phIdx]}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={isEditing}
            rows={1}
            style={{
              flex: 1,
              minHeight: '40px',
              maxHeight: '100px',
              padding: '10px 0',
              fontSize: '13px',
              lineHeight: 1.6,
              fontFamily: 'inherit',
              color: 'var(--text-primary)',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              display: 'block',
            }}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim() || isEditing}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              flexShrink: 0,
              marginBottom: 3,
              background: text.trim() && !isEditing ? 'var(--accent-primary)' : 'var(--bg-hover)',
              color: text.trim() && !isEditing ? '#fff' : 'var(--text-tertiary)',
              cursor: text.trim() && !isEditing ? 'pointer' : 'not-allowed',
              transition: 'all var(--transition-base)',
            }}
          >
            {isEditing
              ? <Spinner size={14} />
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
            }
          </button>
        </div>
      </div>

      {/* Loading state */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '6px 14px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'flex', gap: 3 }}>
                {[0,1,2].map(i => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-primary)', display: 'block' }}
                  />
                ))}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Olly is applying your changes…
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success callout */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            style={{
              margin: '0 14px 10px',
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
              fontSize: '12px',
              color: 'var(--green)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint chips */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '4px 14px 12px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {HINT_CHIPS.map(chip => (
          <HintChip key={chip.label} label={chip.label} onClick={() => insertHint(chip.text)} />
        ))}
      </div>
    </div>
  );
}

function HintChip({ label, onClick }: { label: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 500,
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        cursor: 'pointer',
        border: '1px solid var(--border-subtle)',
        background: hov ? 'var(--bg-hover)' : 'transparent',
        color: hov ? 'var(--text-primary)' : 'var(--text-tertiary)',
        transition: 'all var(--transition-fast)',
      }}
    >
      {label}
    </button>
  );
}

export default FreeformPromptBox;
