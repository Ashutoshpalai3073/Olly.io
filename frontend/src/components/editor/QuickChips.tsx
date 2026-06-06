import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Spinner from '../ui/Spinner';
import { useResponseStore } from '../../store';
import type { GenerateResponseRequest, ApplyPromptRequest, ReviewContext, BrandSettingsPayload } from '../../lib/api';

interface QuickAction {
  label:       string;
  icon:        string;
  instruction: string;
  isRegenerate?: boolean;
}

const ACTIONS: QuickAction[] = [
  { label: 'Regenerate',  icon: '↺', instruction: '',           isRegenerate: true },
  { label: 'Shorter',     icon: '↕', instruction: 'Shorten this response by about 30%, keeping all key points' },
  { label: 'Longer',      icon: '↑', instruction: 'Expand this response with more helpful detail and warmth' },
  { label: 'Friendlier',  icon: '☺', instruction: 'Rewrite this response in a warmer, more friendly tone' },
  { label: 'Professional',icon: '◈', instruction: 'Rewrite this response in a polished, professional tone' },
  { label: 'Casual',      icon: '✿', instruction: 'Rewrite this response in a relaxed, casual tone' },
  { label: 'Add Contact', icon: '✉', instruction: 'Add our contact information naturally at the appropriate point' },
  { label: 'Add Social',  icon: '🔗', instruction: 'Add our social media handles naturally at the appropriate point' },
];

export interface QuickChipsProps {
  review:        ReviewContext;
  brandSettings: BrandSettingsPayload;
  reviewId:      string;
  generatePayload?: GenerateResponseRequest;
}

export function QuickChips({ review, brandSettings, reviewId, generatePayload }: QuickChipsProps) {
  const { currentResponse, isGenerating, isEditing, generate, applyPrompt } = useResponseStore();
  const [activeChip, setActiveChip]   = useState<string | null>(null);
  const [doneChip,   setDoneChip]     = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isBusy = isGenerating || isEditing || activeChip !== null;

  const handleChip = useCallback(async (action: QuickAction) => {
    if (isBusy || !currentResponse) return;
    setActiveChip(action.label);

    try {
      if (action.isRegenerate && generatePayload) {
        await generate(generatePayload);
      } else {
        const payload: ApplyPromptRequest = {
          content:       currentResponse.content,
          prompt:        action.instruction,
          review,
          brandSettings,
        };
        await applyPrompt(payload);
      }
      setDoneChip(action.label);
      setTimeout(() => setDoneChip(null), 1600);
    } finally {
      setActiveChip(null);
    }
  }, [isBusy, currentResponse, generate, applyPrompt, generatePayload, review, brandSettings]);

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        paddingBottom: 2,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style>{`.quick-chips-scroll::-webkit-scrollbar{display:none}`}</style>
      {ACTIONS.map(action => {
        const isLoading = activeChip === action.label;
        const isDone    = doneChip   === action.label;
        const disabled  = isBusy && !isLoading;

        return (
          <QuickChip
            key={action.label}
            action={action}
            loading={isLoading}
            done={isDone}
            disabled={disabled}
            onClick={() => handleChip(action)}
          />
        );
      })}
    </div>
  );
}

function QuickChip({
  action, loading, done, disabled, onClick,
}: {
  action: QuickAction;
  loading: boolean;
  done: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);

  return (
    <button
      type="button"
      onClick={disabled || loading ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 12px',
        borderRadius: '999px',
        fontSize: '13px',
        fontWeight: 500,
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        cursor: disabled ? 'not-allowed' : loading ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'all var(--transition-base)',
        border: loading
          ? '1px solid var(--accent-border)'
          : done
          ? '1px solid rgba(34,197,94,0.3)'
          : hov
          ? '1px solid var(--border-strong)'
          : '1px solid var(--border-default)',
        background: loading
          ? 'var(--accent-muted)'
          : done
          ? 'rgba(34,197,94,0.12)'
          : hov
          ? 'var(--bg-hover)'
          : 'var(--bg-elevated)',
        color: loading
          ? 'var(--accent-primary)'
          : done
          ? 'var(--green)'
          : hov
          ? 'var(--text-primary)'
          : 'var(--text-secondary)',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.span key="spin" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <Spinner size={11} />
          </motion.span>
        ) : done ? (
          <motion.span key="done" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ fontSize: '12px' }}>
            ✓
          </motion.span>
        ) : (
          <motion.span key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ fontSize: '12px', lineHeight: 1 }}>
            {action.icon}
          </motion.span>
        )}
      </AnimatePresence>
      {action.label}
    </button>
  );
}

export default QuickChips;
