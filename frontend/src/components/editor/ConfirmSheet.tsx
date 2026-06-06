import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet } from '../ui/Sheet';
import { PlatformBadge } from '../ui/PlatformBadge';
import { Button } from '../ui/Button';
import { useResponseStore, useReviewStore, useUIStore } from '../../store';
import type { DBReview } from '../../lib/supabase';

function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const mins  = words / 200;
  if (mins < 1) return `${Math.ceil(mins * 60)} sec read`;
  return `${Math.ceil(mins)} min read`;
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export interface ConfirmSheetProps {
  open:       boolean;
  onClose:    () => void;
  review:     DBReview;
  onPosted:   () => void;
}

export function ConfirmSheet({ open, onClose, review, onPosted }: ConfirmSheetProps) {
  const { currentResponse, saveVersion } = useResponseStore();
  const { updateReviewStatus }           = useReviewStore();
  const addToast                         = useUIStore(s => s.addToast);
  const [posting, setPosting]            = useState(false);

  const content  = currentResponse?.content ?? '';
  const words    = wordCount(content);
  const readTime = readingTime(content);
  const mainTag  = review.tags?.complaints?.[0] ?? review.tags?.praises?.[0] ?? null;

  const handleConfirm = useCallback(async () => {
    if (!currentResponse || posting) return;
    setPosting(true);
    try {
      await saveVersion(review.id, 'Approved & posted');
      await updateReviewStatus(review.id, 'posted');
      addToast({ type: 'success', message: 'Response posted!', description: 'The review has been marked as responded.', duration: 4000 });
      onClose();
      onPosted();
    } finally {
      setPosting(false);
    }
  }, [currentResponse, posting, review.id, saveVersion, updateReviewStatus, addToast, onClose, onPosted]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Review & confirm"
      minHeight="55vh"
      footer={
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose} disabled={posting}>
            Go back
          </Button>
          <Button variant="primary" onClick={handleConfirm} loading={posting}>
            Confirm &amp; Post
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Posting to:</span>
            <PlatformBadge platform={review.platform as any} />
          </div>
          <div style={{
            display: 'flex', gap: 12, marginLeft: 'auto',
            fontSize: '12px', color: 'var(--text-tertiary)',
          }}>
            <span>{words} words</span>
            <span>·</span>
            <span>{readTime}</span>
          </div>
        </div>

        {/* Learning note */}
        <div style={{
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-muted)',
          border: '1px solid var(--accent-border)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
        }}>
          <span style={{ fontSize: '15px', flexShrink: 0, marginTop: 1 }}>✦</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: 2 }}>
              Olly will learn from this
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              This response style for{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{review.rating}-star</strong> reviews
              {mainTag ? (
                <> about <strong style={{ color: 'var(--text-primary)' }}>{mainTag}</strong></>
              ) : null}
              {' '}on <strong style={{ color: 'var(--text-primary)' }}>{review.platform}</strong>.
            </div>
          </div>
        </div>

        {/* Response preview */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Response preview
          </div>
          <div style={{
            maxHeight: '40vh',
            overflowY: 'auto',
            padding: '14px 16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            lineHeight: 1.8,
            color: 'var(--text-primary)',
            fontFamily: "'Geist Mono', 'Courier New', monospace",
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {content || <span style={{ color: 'var(--text-tertiary)' }}>No response content</span>}
          </div>
        </div>

        {/* Character count and platform compliance */}
        <CharCountInfo content={content} platform={review.platform} />
      </div>
    </Sheet>
  );
}

const PLATFORM_LIMITS: Record<string, { label: string; limit: number }> = {
  google: { label: 'Google', limit: 4096 }, zomato: { label: 'Zomato', limit: 1000 },
  swiggy: { label: 'Swiggy', limit: 500 },  tripadvisor: { label: 'TripAdvisor', limit: 2000 },
};

function CharCountInfo({ content, platform }: { content: string; platform: string }) {
  const info  = PLATFORM_LIMITS[platform?.toLowerCase()];
  if (!info) return null;
  const pct   = content.length / info.limit;
  const ok    = pct <= 1;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px',
      color: ok ? 'var(--text-tertiary)' : 'var(--red)',
    }}>
      {ok ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5"><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
      )}
      {content.length.toLocaleString()} / {info.limit.toLocaleString()} chars for {info.label}
      {!ok && ' — exceeds platform limit'}
    </div>
  );
}

export default ConfirmSheet;
