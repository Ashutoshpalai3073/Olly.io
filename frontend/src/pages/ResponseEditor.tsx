import {
  useRef, useState, useEffect, useCallback,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useReviewStore, useResponseStore, useAuthStore, useUIStore,
} from '../store';
import { MOCK_REVIEWS } from '../lib/mockData';
import { Spinner }             from '../components/ui/Spinner';
import { ReviewCard }          from '../components/review/ReviewCard';
import { TagExtractor }        from '../components/review/TagExtractor';
import { Button }              from '../components/ui/Button';
import { Shimmer }             from '../components/ui/Shimmer';
import { ResponseEditorBox }   from '../components/editor/ResponseEditorBox';
import { SelectionToolbar }    from '../components/editor/SelectionToolbar';
import { QuickChips }          from '../components/editor/QuickChips';
import { FreeformPromptBox }   from '../components/editor/FreeformPromptBox';
import { RecoveryOfferWidget } from '../components/offer/RecoveryOfferWidget';
import { EditHistoryPanel }    from '../components/history/EditHistoryPanel';
import { ConfirmSheet }        from '../components/editor/ConfirmSheet';
import type { DBReview, DBProfile } from '../lib/supabase';
import type {
  ReviewContext, BrandSettingsPayload, GenerateResponseRequest,
} from '../lib/api';
import type { SelectionAction } from '../components/editor/SelectionToolbar';

const DEFAULT_RESPONSE =
  `Thank you for taking the time to share your feedback with us. ` +
  `We truly value your input and will use it to improve our service. ` +
  `We hope to welcome you back soon!\n\nWarm regards,\nThe Team at Pasta & More`;

// ── Helpers ────────────────────────────────────────────────────

function buildReviewContext(r: DBReview): ReviewContext {
  return {
    reviewText:   r.review_text,
    reviewerName: r.reviewer_name ?? 'Guest',
    rating:       r.rating,
    platform:     r.platform,
    locationName: r.location_name ?? '',
  };
}

function buildBrandSettings(p: DBProfile): BrandSettingsPayload {
  return {
    brandName:     p.brand_name     ?? '',
    brandVoice:    p.brand_voice    ?? '',
    brandRules:    p.brand_rules    ?? [],
    toneFormality: p.tone_formality ?? 50,
    toneWarmth:    p.tone_warmth    ?? 50,
    toneVerbosity: p.tone_verbosity ?? 50,
    offerTemplate: p.offer_template ?? '',
    contactInfo:   p.contact_info   ?? '',
    platforms:     p.platforms      ?? [],
  };
}

// ── Page ───────────────────────────────────────────────────────

export function ResponseEditor() {
  const { id: paramId }         = useParams<{ id: string }>();
  const navigate                = useNavigate();

  const { reviews, currentReview, setCurrentReview, updateReviewStatus } = useReviewStore();
  const {
    currentResponse, isGenerating, isEditing,
    editSelection, setContent, undo, redo, clearCurrent,
  }                             = useResponseStore();
  const { profile }             = useAuthStore();
  const { addToast }            = useUIStore();

  const textareaRef             = useRef<HTMLTextAreaElement>(null);
  const genTimerRef             = useRef<ReturnType<typeof setTimeout>>();
  const generatedForRef         = useRef<Set<string>>(new Set());

  // Resolve the review immediately from store (pre-seeded) or mock data — never show a blank slate.
  const resolvedReview = currentReview
    ?? reviews.find(r => r.id === paramId)
    ?? MOCK_REVIEWS.find(r => r.id === paramId)
    ?? MOCK_REVIEWS[0];

  const [review,        setReview]       = useState<DBReview | null>(resolvedReview);
  const [reviewLoading, setReviewLoading] = useState(false); // always false — data is available immediately
  const [selection,  setSelection]      = useState({ start: 0, end: 0, text: '' });
  const [toolbarVis, setToolbarVis]     = useState(false);
  const [toolbarLoading, setToolbarLoading] = useState(false);
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [rulesOpen,   setRulesOpen]     = useState(false);
  const [skipping,    setSkipping]      = useState(false);

  // ── Load review ──────────────────────────────────────────────

  useEffect(() => {
    // `resolvedReview` is always defined (falls back to MOCK_REVIEWS[0]).
    // Ensure the store has it set so the cross-store subscription fires
    // and loadForReview populates currentResponse.
    if (currentReview?.id !== resolvedReview?.id) {
      if (resolvedReview) setCurrentReview(resolvedReview);
    }
    if (resolvedReview) setReview(resolvedReview);
    setReviewLoading(false);
  }, [paramId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Seed default response if no existing response ───────────

  useEffect(() => {
    if (!review?.id) return;
    clearTimeout(genTimerRef.current);

    genTimerRef.current = setTimeout(() => {
      const store = useResponseStore.getState();
      if (store.currentResponse !== null || store.isGenerating) return;
      if (generatedForRef.current.has(review.id)) return;

      generatedForRef.current.add(review.id);
      useResponseStore.setState({
        currentResponse: {
          id:           'default',
          review_id:    review.id,
          user_id:      'local',
          content:      DEFAULT_RESPONSE,
          version:      1,
          is_active:    true,
          edit_history: [],
          posted_at:    null,
          created_at:   new Date().toISOString(),
          updated_at:   new Date().toISOString(),
        },
      });
    }, 400);

    return () => clearTimeout(genTimerRef.current);
  }, [review?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard shortcuts ───────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault(); undo();
      } else if (ctrl && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault(); redo();
      } else if (ctrl && e.key === 'Enter') {
        e.preventDefault(); setConfirmOpen(true);
      } else if (e.key === 'Escape') {
        setToolbarVis(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // ── Selection toolbar ────────────────────────────────────────

  const handleSelectionChange = useCallback((start: number, end: number, text: string) => {
    if (text.length > 2) {
      setSelection({ start, end, text });
      setToolbarVis(true);
    } else {
      setToolbarVis(false);
    }
  }, []);

  const handleSelectionAction = useCallback(async (action: SelectionAction, text: string, _start: number, _end: number) => {
    if (!review || !profile || !currentResponse) return;
    setToolbarLoading(true);
    try {
      await editSelection({
        selectedText:  text,
        fullContent:   currentResponse.content,
        instruction:   action.instruction,
        review:        buildReviewContext(review),
        brandSettings: buildBrandSettings(profile),
      });
    } finally {
      setToolbarLoading(false);
      setToolbarVis(false);
    }
  }, [review, profile, currentResponse, editSelection]);

  const handleDelete = useCallback((start: number, end: number) => {
    if (!currentResponse) return;
    setContent(currentResponse.content.slice(0, start) + currentResponse.content.slice(end));
    setToolbarVis(false);
  }, [currentResponse, setContent]);

  // ── Navigation helpers ───────────────────────────────────────

  const navigateToNext = useCallback(() => {
    if (!review) return;
    const pending = reviews.filter(r => r.status === 'pending' && r.id !== review.id);
    if (pending.length > 0) {
      setCurrentReview(pending[0]);
      navigate(`/editor/${pending[0].id}`);
    } else {
      clearCurrent();
      navigate('/reviews');
    }
  }, [review, reviews, setCurrentReview, clearCurrent, navigate]);

  // ── Skip ─────────────────────────────────────────────────────

  const handleSkip = useCallback(async () => {
    if (!review || skipping) return;
    setSkipping(true);
    await updateReviewStatus(review.id, 'ignored');
    addToast({ type: 'success', message: 'Review skipped', duration: 2500 });
    navigateToNext();
  }, [review, skipping, updateReviewStatus, addToast, navigateToNext]);

  // ── Derived ───────────────────────────────────────────────────

  const reviewCtx    = review ? buildReviewContext(review) : null;
  const brandSettings = profile ? buildBrandSettings(profile) : null;

  const generatePayload: GenerateResponseRequest | undefined =
    review && profile && reviewCtx && brandSettings
      ? { reviewId: review.id, review: reviewCtx, brandSettings, includeOffer: false }
      : undefined;

  const isBusy = isGenerating || isEditing;

  // ── Render ────────────────────────────────────────────────────

  if (reviewLoading) return <PageSkeleton />;
  if (!review)       return <PageSkeleton />;

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      minHeight: 0,
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      {/* ── Left panel (380px) ───────────────────────────── */}
      <div style={{
        width: 380,
        flexShrink: 0,
        overflowY: 'auto',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '20px 16px',
      }}>
        {/* Review card */}
        <ReviewCard review={review} />

        {/* Tag extractor */}
        <TagExtractor review={review} />

        {/* Brand rules (collapsible) */}
        {profile?.brand_rules && profile.brand_rules.length > 0 && (
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}>
            <button
              type="button"
              onClick={() => setRulesOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '10px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Brand Rules
                </span>
                <span style={{
                  fontSize: '11px', padding: '1px 6px', borderRadius: '999px',
                  background: 'var(--accent-muted)', color: 'var(--accent-primary)',
                  border: '1px solid var(--accent-border)',
                }}>
                  {profile.brand_rules.length}
                </span>
              </div>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-tertiary)" strokeWidth="2"
                style={{
                  transform: rulesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform var(--transition-base)',
                }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {rulesOpen && (
              <div style={{
                padding: '0 14px 12px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                {profile.brand_rules.map((rule, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5,
                    paddingTop: 8,
                  }}>
                    <span style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 1 }}>✦</span>
                    {rule}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit history */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
        }}>
          <EditHistoryPanel reviewId={review.id} />
        </div>
      </div>

      {/* ── Right panel (flex 1) ──────────────────────────── */}
      <div style={{
        flex: 1,
        minWidth: 0,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: '20px 24px',
      }}>

        {/* Response editor box */}
        {isGenerating && !currentResponse?.content ? (
          <EditorShimmer />
        ) : (
          <ResponseEditorBox
            reviewId={review.id}
            platform={review.platform}
            onSelectionChange={handleSelectionChange}
            textareaRef={textareaRef}
          />
        )}

        {/* Quick chips */}
        {reviewCtx && brandSettings && (
          <QuickChips
            review={reviewCtx}
            brandSettings={brandSettings}
            reviewId={review.id}
            generatePayload={generatePayload}
          />
        )}

        {/* Freeform prompt */}
        {reviewCtx && brandSettings && (
          <FreeformPromptBox
            review={reviewCtx}
            brandSettings={brandSettings}
          />
        )}

        {/* Recovery offer widget */}
        <RecoveryOfferWidget defaultOfferText={profile?.offer_template ?? ''} />

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0 4px',
          borderTop: '1px solid var(--border-subtle)',
          marginTop: 'auto',
          flexShrink: 0,
        }}>
          <AutosaveStatus />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSkip}
              loading={skipping}
              disabled={isBusy && !skipping}
            >
              Skip
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={isBusy || !currentResponse?.content}
            >
              Approve →
            </Button>
          </div>
        </div>
      </div>

      {/* ── SelectionToolbar (portal) ─────────────────────── */}
      <SelectionToolbar
        textareaRef={textareaRef}
        selectionStart={selection.start}
        selectionEnd={selection.end}
        selectedText={selection.text}
        visible={toolbarVis && !isBusy}
        loading={toolbarLoading}
        onAction={handleSelectionAction}
        onDelete={handleDelete}
        onDismiss={() => setToolbarVis(false)}
      />

      {/* ── Confirm sheet ─────────────────────────────────── */}
      <ConfirmSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        review={review}
        onPosted={navigateToNext}
      />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function AutosaveStatus() {
  const { isSaving, lastSaved } = useResponseStore();
  if (isSaving) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--text-tertiary)' }}>
        <Spinner size={12} />
        Saving…
      </div>
    );
  }
  if (lastSaved) {
    return (
      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Draft saved
      </div>
    );
  }
  return null;
}

function PageSkeleton() {
  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Left panel */}
      <div style={{ width: 380, flexShrink: 0, padding: '20px 16px', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Shimmer height={160} borderRadius="var(--radius-md)" />
        <Shimmer height={120} borderRadius="var(--radius-md)" />
        <Shimmer height={80}  borderRadius="var(--radius-md)" />
      </div>
      {/* Right panel */}
      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Shimmer height={300} borderRadius="var(--radius-md)" />
        <Shimmer height={44}  borderRadius="var(--radius-md)" />
        <Shimmer height={100} borderRadius="var(--radius-md)" />
      </div>
    </div>
  );
}

function EditorShimmer() {
  return (
    <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      {/* Toolbar shimmer */}
      <div style={{
        height: 44, background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)', borderBottom: 'none',
        borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Shimmer width={60} height={20} borderRadius={999} />
        <Shimmer width={70} height={16} borderRadius={4} />
        <Shimmer width={50} height={16} borderRadius={4} />
      </div>
      {/* Textarea shimmer */}
      <div style={{
        minHeight: 220, background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: '0 0 var(--radius-md) var(--radius-md)',
        padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {[85, 92, 78, 88, 65].map((w, i) => (
          <Shimmer key={i} width={`${w}%`} height={14} borderRadius={4} />
        ))}
      </div>
    </div>
  );
}

export default ResponseEditor;
