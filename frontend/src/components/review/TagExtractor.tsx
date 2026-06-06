import { useState, useRef, useCallback } from 'react';
import type { DBReview, ReviewTags } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { USE_MOCK_DATA } from '@/lib/mockData';
import { useReviewStore } from '@/store';

// ── helpers ──────────────────────────────────────────────────

type TagSentiment = 'complaint' | 'praise';

const SECTION_CFG = {
  complaint: {
    label:     'Complaints',
    dotColor:  'var(--red)',
    tagBg:     'rgba(239,68,68,0.10)',
    tagColor:  'var(--red)',
    tagBorder: 'rgba(239,68,68,0.20)',
    addBg:     'rgba(239,68,68,0.08)',
    addColor:  'var(--red)',
  },
  praise: {
    label:     'Praises',
    dotColor:  'var(--green)',
    tagBg:     'rgba(34,197,94,0.10)',
    tagColor:  'var(--green)',
    tagBorder: 'rgba(34,197,94,0.20)',
    addBg:     'rgba(34,197,94,0.08)',
    addColor:  'var(--green)',
  },
} as const;

// ── props ────────────────────────────────────────────────────

export interface TagExtractorProps {
  review:         DBReview;
  onTagsChange?:  (tags: ReviewTags) => void;
  className?:     string;
  style?:         React.CSSProperties;
}

// ── component ────────────────────────────────────────────────

export function TagExtractor({ review, onTagsChange, className = '', style }: TagExtractorProps) {
  const [tags, setTags] = useState<ReviewTags>({
    complaints: review.tags?.complaints ?? [],
    praises:    review.tags?.praises    ?? [],
  });

  /* Which section has its "add input" open */
  const [addingIn, setAddingIn]   = useState<TagSentiment | null>(null);
  const [inputVal, setInputVal]   = useState('');
  const [saving,   setSaving]     = useState(false);
  const inputRef                  = useRef<HTMLInputElement>(null);

  /* Persist to Supabase or update mock store */
  const persist = useCallback(async (next: ReviewTags) => {
    setSaving(true);
    if (!USE_MOCK_DATA) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('reviews') as any).update({ tags: next }).eq('id', review.id);
    }
    /* Update store's reviews array in-place */
    useReviewStore.setState((state) => ({
      reviews: state.reviews.map((r) =>
        r.id === review.id ? { ...r, tags: next } : r,
      ),
      currentReview:
        state.currentReview?.id === review.id
          ? { ...state.currentReview, tags: next }
          : state.currentReview,
    }));
    setSaving(false);
    onTagsChange?.(next);
  }, [review.id, onTagsChange]);

  const removeTag = useCallback((sentiment: TagSentiment, tag: string) => {
    const next: ReviewTags = {
      complaints: tags.complaints.filter((t) => !(sentiment === 'complaint' && t === tag)),
      praises:    tags.praises.filter((t)    => !(sentiment === 'praise'    && t === tag)),
    };
    setTags(next);
    void persist(next);
  }, [tags, persist]);

  const commitAdd = useCallback(() => {
    const val = inputVal.trim();
    if (!val || !addingIn) { setAddingIn(null); setInputVal(''); return; }

    const next: ReviewTags = {
      complaints: addingIn === 'complaint' && !tags.complaints.includes(val)
        ? [...tags.complaints, val]
        : tags.complaints,
      praises: addingIn === 'praise' && !tags.praises.includes(val)
        ? [...tags.praises, val]
        : tags.praises,
    };
    setTags(next);
    setAddingIn(null);
    setInputVal('');
    void persist(next);
  }, [inputVal, addingIn, tags, persist]);

  const openAdd = (s: TagSentiment) => {
    setAddingIn(s);
    setInputVal('');
    /* Focus after render */
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: 14, ...style }}
    >
      {saving && (
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', alignSelf: 'flex-end' }}>
          Saving…
        </span>
      )}

      {(['complaint', 'praise'] as TagSentiment[]).map((sentiment) => {
        const cfg  = SECTION_CFG[sentiment];
        const list = sentiment === 'complaint' ? tags.complaints : tags.praises;

        return (
          <div key={sentiment} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width:        6,
                  height:       6,
                  borderRadius: '50%',
                  background:   cfg.dotColor,
                  flexShrink:   0,
                }}
              />
              <span
                style={{
                  fontSize:   '11px',
                  fontWeight: 600,
                  color:      'var(--text-tertiary)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {cfg.label}
              </span>
            </div>

            {/* Tags + Add button */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {list.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display:      'inline-flex',
                    alignItems:   'center',
                    gap:          4,
                    fontSize:     '12px',
                    fontWeight:   500,
                    padding:      '3px 8px',
                    borderRadius: '999px',
                    background:   cfg.tagBg,
                    color:        cfg.tagColor,
                    border:       `1px solid ${cfg.tagBorder}`,
                    lineHeight:   1.4,
                  }}
                >
                  {tag}
                  <button
                    onClick={() => removeTag(sentiment, tag)}
                    aria-label={`Remove ${tag}`}
                    style={{
                      display:        'inline-flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      width:          14,
                      height:         14,
                      borderRadius:   '50%',
                      background:     'transparent',
                      border:         'none',
                      color:          cfg.tagColor,
                      opacity:        0.7,
                      cursor:         'pointer',
                      padding:        0,
                      fontFamily:     'inherit',
                      fontSize:       '13px',
                      lineHeight:     1,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}

              {/* Inline add input */}
              {addingIn === sentiment ? (
                <input
                  ref={inputRef}
                  value={inputVal}
                  maxLength={40}
                  placeholder="Add tag…"
                  onChange={(e) => setInputVal(e.target.value)}
                  onBlur={commitAdd}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitAdd();
                    if (e.key === 'Escape') { setAddingIn(null); setInputVal(''); }
                  }}
                  style={{
                    fontSize:     '12px',
                    padding:      '3px 8px',
                    borderRadius: '999px',
                    background:   cfg.addBg,
                    color:        cfg.tagColor,
                    border:       `1px solid ${cfg.tagBorder}`,
                    outline:      'none',
                    width:        100,
                    fontFamily:   'inherit',
                  }}
                />
              ) : (
                <button
                  onClick={() => openAdd(sentiment)}
                  aria-label={`Add ${cfg.label.toLowerCase().slice(0, -1)}`}
                  style={{
                    display:        'inline-flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    width:          22,
                    height:         22,
                    borderRadius:   '50%',
                    background:     cfg.addBg,
                    color:          cfg.tagColor,
                    border:         `1px solid ${cfg.tagBorder}`,
                    cursor:         'pointer',
                    fontSize:       '16px',
                    lineHeight:     1,
                    padding:        0,
                    fontFamily:     'inherit',
                    transition:     'opacity var(--transition-base)',
                  }}
                >
                  +
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TagExtractor;
