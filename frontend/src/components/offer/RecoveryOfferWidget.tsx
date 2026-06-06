import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toggle } from '../ui/Toggle';
import { useResponseStore } from '../../store';

const EXPIRY_OPTIONS = [
  { value: '30days',  label: 'Valid 30 days' },
  { value: 'weekend', label: 'This weekend' },
  { value: 'none',    label: 'No expiry' },
  { value: 'custom',  label: 'Custom' },
] as const;

type ExpiryOption = typeof EXPIRY_OPTIONS[number]['value'];

const SIGN_OFF_RE = /^(Best|Regards|Sincerely|Thank you|Thanks|Warm regards|Yours|With thanks|Kind regards|Cheers|Take care)[,.]?\s*/im;

function buildOfferLine(offerText: string, expiry: ExpiryOption, customDate: string): string {
  if (!offerText.trim()) return '';
  const suffix =
    expiry === '30days'  ? ' (valid for 30 days)' :
    expiry === 'weekend' ? ' (this weekend only)'  :
    expiry === 'custom' && customDate ? ` (valid until ${customDate})` :
    '';
  return offerText.trim() + suffix;
}

function insertOfferIntoResponse(response: string, offerLine: string): string {
  if (!offerLine) return response;
  const lines = response.split('\n');
  const idx   = lines.findIndex(l => SIGN_OFF_RE.test(l.trim()));
  if (idx > 0) {
    lines.splice(idx, 0, offerLine, '');
    return lines.join('\n');
  }
  return response.trimEnd() + '\n\n' + offerLine;
}

export interface RecoveryOfferWidgetProps {
  defaultOfferText?: string;
}

export function RecoveryOfferWidget({ defaultOfferText = '' }: RecoveryOfferWidgetProps) {
  const { currentResponse, setContent } = useResponseStore();

  const [enabled,    setEnabled]    = useState(false);
  const [offerText,  setOfferText]  = useState(defaultOfferText);
  const [expiry,     setExpiry]     = useState<ExpiryOption>('30days');
  const [customDate, setCustomDate] = useState('');
  const [inserted,   setInserted]   = useState(false);

  const offerLine = buildOfferLine(offerText, expiry, customDate);

  const handleInsert = useCallback(() => {
    if (!currentResponse || !offerLine) return;
    const updated = insertOfferIntoResponse(currentResponse.content, offerLine);
    setContent(updated);
    setInserted(true);
    setTimeout(() => setInserted(false), 2500);
  }, [currentResponse, offerLine, setContent]);

  return (
    <div style={{
      background: 'rgba(245,158,11,0.06)',
      border: '1px solid rgba(245,158,11,0.2)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '15px' }}>🎁</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yellow)' }}>
              Recovery Offer
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 1 }}>
              Include a goodwill gesture to win them back
            </div>
          </div>
        </div>
        <Toggle checked={enabled} onChange={setEnabled} />
      </div>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            key="offer-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ height: 1, background: 'rgba(245,158,11,0.15)' }} />

              {/* Offer text */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                  Offer text
                </label>
                <textarea
                  value={offerText}
                  onChange={e => setOfferText(e.target.value)}
                  placeholder="e.g. Please enjoy 20% off your next visit with code COMEBACK20"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-surface)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 'var(--radius-sm)',
                    resize: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--yellow)'; e.target.style.boxShadow = '0 0 0 2px rgba(245,158,11,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(245,158,11,0.25)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Expiry */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                  Validity
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {EXPIRY_OPTIONS.map(opt => (
                    <ExpiryChip
                      key={opt.value}
                      label={opt.label}
                      active={expiry === opt.value}
                      onClick={() => setExpiry(opt.value)}
                    />
                  ))}
                </div>
                {expiry === 'custom' && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={e => setCustomDate(e.target.value)}
                    style={{
                      marginTop: 8, padding: '6px 10px',
                      fontSize: '12px', fontFamily: 'inherit',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-surface)',
                      border: '1px solid rgba(245,158,11,0.25)',
                      borderRadius: 'var(--radius-sm)',
                      outline: 'none',
                      colorScheme: 'dark',
                    }}
                  />
                )}
              </div>

              {/* Preview */}
              {offerLine && (
                <div style={{
                  padding: '8px 10px',
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.18)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--yellow)', fontWeight: 600, marginBottom: 4, opacity: 0.8 }}>
                    Preview
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                    "{offerLine}"
                  </div>
                </div>
              )}

              {/* Insert button */}
              <button
                type="button"
                onClick={handleInsert}
                disabled={!offerLine || inserted}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: !offerLine || inserted ? 'not-allowed' : 'pointer',
                  background: inserted ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                  color: inserted ? 'var(--green)' : 'var(--yellow)',
                  opacity: !offerLine ? 0.5 : 1,
                  transition: 'all var(--transition-base)',
                }}
              >
                {inserted ? (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Inserted!</>
                ) : (
                  <>Insert into response →</>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExpiryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '3px 10px', borderRadius: '999px',
        fontSize: '12px', fontWeight: 500, fontFamily: 'inherit',
        cursor: 'pointer', transition: 'all var(--transition-fast)',
        border: active ? '1px solid rgba(245,158,11,0.5)' : '1px solid var(--border-subtle)',
        background: active ? 'rgba(245,158,11,0.15)' : hov ? 'var(--bg-hover)' : 'transparent',
        color: active ? 'var(--yellow)' : hov ? 'var(--text-secondary)' : 'var(--text-tertiary)',
      }}
    >
      {label}
    </button>
  );
}

export default RecoveryOfferWidget;
