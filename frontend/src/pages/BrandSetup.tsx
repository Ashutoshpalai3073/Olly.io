import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Slider } from '../components/ui/Slider';
import { useAuthStore } from '../store';
import { analyzeBrandVoice } from '../lib/api';
import { Spinner } from '../components/ui/Spinner';

// ── Types ──────────────────────────────────────────────────────
type RestaurantType = 'qsr' | 'casual' | 'fine' | 'cloud';
type Platform       = 'google' | 'zomato' | 'swiggy' | 'tripadvisor';

interface WizardData {
  brandName:        string;
  restaurantType:   RestaurantType | null;
  locationCount:    number;
  platforms:        Platform[];
  voiceSamples:     string;
  toneDescriptors:  string[];
  formality:        number;
  warmth:           number;
  verbosity:        number;
  rules:            string[];
  offerEnabled:     boolean;
  offerText:        string;
  contactInfo:      string;
}

const DEFAULTS: WizardData = {
  brandName: '', restaurantType: null, locationCount: 1, platforms: ['google'],
  voiceSamples: '', toneDescriptors: [], formality: 50, warmth: 60, verbosity: 45,
  rules: [
    'Always thank the reviewer by name if provided',
    'Acknowledge specific dishes or staff mentioned',
    'Never make excuses for cold food or long wait times',
  ],
  offerEnabled: false, offerText: '', contactInfo: '',
};

const RULE_SUGGESTIONS = [
  'Sign off with your manager\'s name',
  'For 1–2 star reviews, apologise first',
  'Include a specific remedy or next step',
  'Keep responses under 150 words',
];

const RESTAURANT_TYPES: { value: RestaurantType; label: string; emoji: string; desc: string }[] = [
  { value: 'qsr',    label: 'QSR',           emoji: '🍔', desc: 'Quick service, high volume' },
  { value: 'casual', label: 'Casual Dining',  emoji: '🍽️', desc: 'Relaxed full-service restaurant' },
  { value: 'fine',   label: 'Fine Dining',    emoji: '🥂', desc: 'Upscale, formal experience' },
  { value: 'cloud',  label: 'Cloud Kitchen',  emoji: '📦', desc: 'Delivery-first operation' },
];

const PLATFORMS: { value: Platform; label: string; color: string }[] = [
  { value: 'google',      label: 'Google',      color: '#4285F4' },
  { value: 'zomato',      label: 'Zomato',      color: '#E23744' },
  { value: 'swiggy',      label: 'Swiggy',      color: '#FC8019' },
  { value: 'tripadvisor', label: 'TripAdvisor', color: '#00AA6C' },
];

const STEP_LABELS = ['Brand Basics', 'Brand Voice', 'Brand Rules', 'All Set'];

// ── CSS injections ─────────────────────────────────────────────
const ANIM_CSS = `
@keyframes check-circle {
  from { stroke-dashoffset: 251; }
  to   { stroke-dashoffset: 0; }
}
@keyframes check-mark {
  from { stroke-dashoffset: 80; }
  to   { stroke-dashoffset: 0; }
}
@keyframes confetti-fall {
  0%   { transform: translateY(-80px) rotate(0deg);   opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
`;

const CONFETTI_COLORS = ['#ff6b35','#3b82f6','#22c55e','#f59e0b','#ec4899','#8b5cf6'];

function ConfettiPiece({ idx }: { idx: number }) {
  const x    = useMemo(() => Math.random() * 100, []);
  const size = useMemo(() => 6 + Math.random() * 8, []);
  const dur  = useMemo(() => 1.8 + Math.random() * 2.4, []);
  const del  = useMemo(() => Math.random() * 1.2, []);
  const color = CONFETTI_COLORS[idx % CONFETTI_COLORS.length];
  const isCircle = idx % 3 === 0;

  return (
    <div style={{
      position: 'fixed',
      left: `${x}%`,
      top: -20,
      width: size,
      height: isCircle ? size : size * 0.5,
      borderRadius: isCircle ? '50%' : 2,
      background: color,
      animation: `confetti-fall ${dur}s ease-in ${del}s forwards`,
      zIndex: 999,
      pointerEvents: 'none',
    }} />
  );
}

// ── Progress bar ───────────────────────────────────────────────
function ProgressBar({ step, total, onClick }: { step: number; total: number; onClick: (s: number) => void }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            onClick={() => i < step && onClick(i)}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= step ? 'var(--accent-primary)' : 'var(--bg-active)',
              cursor: i < step ? 'pointer' : 'default',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {STEP_LABELS.map((label, i) => (
          <span key={i} style={{
            fontSize: '11px', fontWeight: i === step ? 600 : 400,
            color: i === step ? 'var(--accent-primary)' : i < step ? 'var(--text-secondary)' : 'var(--text-tertiary)',
          }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Step slide variants ────────────────────────────────────────
const slideVariants = (dir: 1 | -1) => ({
  initial: { opacity: 0, x: dir * 40 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: dir * -40 },
});

// ── Page ───────────────────────────────────────────────────────
export function BrandSetup() {
  const navigate   = useNavigate();
  const updateProfile = useAuthStore(s => s.updateProfile);

  const [step,      setStep]      = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [data,      setData]      = useState<WizardData>(DEFAULTS);
  const [analyzing, setAnalyzing] = useState(false);
  const [newDescriptor, setNewDescriptor] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error,     setError]     = useState('');

  const update = useCallback(<K extends keyof WizardData>(key: K, val: WizardData[K]) => {
    setData(d => ({ ...d, [key]: val }));
  }, []);

  const goTo = (s: number) => {
    setDirection(s > step ? 1 : -1);
    setStep(s);
  };

  const next = () => {
    if (step === 0 && !data.brandName.trim()) { setError('Brand name is required'); return; }
    setError('');
    goTo(step + 1);
    if (step + 1 === 3) setShowConfetti(true);
  };

  const back = () => goTo(step - 1);

  // ── Analyze voice ──────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!data.voiceSamples.trim()) return;
    setAnalyzing(true);
    const result = await analyzeBrandVoice({
      sampleResponses: [data.voiceSamples],
      brandName:       data.brandName || 'my restaurant',
    });
    setAnalyzing(false);
    if (result.data) {
      setData(d => ({
        ...d,
        toneDescriptors: result.data!.characteristics,
        formality:       result.data!.toneFormality,
        warmth:          result.data!.toneWarmth,
        verbosity:       result.data!.toneVerbosity,
      }));
    }
  };

  // ── Save & finish ──────────────────────────────────────────
  const handleFinish = async () => {
    setSaving(true);
    const result = await updateProfile({
      brand_name:     data.brandName,
      brand_voice:    `${data.restaurantType ?? 'restaurant'}: ${data.toneDescriptors.join(', ')}`,
      brand_rules:    data.rules,
      contact_info:   data.contactInfo || null,
      offer_template: data.offerEnabled ? data.offerText : null,
      platforms:      data.platforms,
      tone_formality: data.formality,
      tone_warmth:    data.warmth,
      tone_verbosity: data.verbosity,
    });
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    navigate('/dashboard', { replace: true });
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '48px 20px 80px',
    }}>
      <style>{ANIM_CSS}</style>

      {showConfetti && Array.from({ length: 40 }).map((_, i) => <ConfettiPiece key={i} idx={i} />)}

      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--accent-primary)' }}>
            Olly<span style={{ fontSize: '10px', verticalAlign: 'super', marginLeft: 1 }}>●</span>
          </span>
        </div>

        {step < 3 && <ProgressBar step={step} total={4} onClick={goTo} />}

        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)', padding: '32px 28px', overflow: 'hidden',
        }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              variants={slideVariants(direction)}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              {step === 0 && <Step1 data={data} update={update} error={error} />}
              {step === 1 && <Step2 data={data} update={update} analyzing={analyzing} onAnalyze={handleAnalyze} newDescriptor={newDescriptor} setNewDescriptor={setNewDescriptor} />}
              {step === 2 && <Step3 data={data} update={update} />}
              {step === 3 && <Step4 data={data} />}
            </motion.div>
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && step === 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontSize: '12px', color: 'var(--red)', margin: '12px 0 0', textAlign: 'center' }}>
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: step === 3 ? 'center' : 'space-between', marginTop: 28 }}>
            {step > 0 && step < 3 && (
              <Button variant="secondary" onClick={back}>← Back</Button>
            )}
            {step < 2 && (
              <Button variant="primary" onClick={next} style={{ marginLeft: 'auto' }}>
                Continue →
              </Button>
            )}
            {step === 2 && (
              <Button variant="primary" onClick={next} style={{ marginLeft: 'auto' }}>
                Looks good →
              </Button>
            )}
            {step === 3 && (
              <Button variant="primary" size="lg" onClick={handleFinish} loading={saving}>
                Start reviewing responses →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Brand Basics ───────────────────────────────────────
function Step1({ data, update, error }: { data: WizardData; update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void; error: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <StepHeader title="Brand Basics" subtitle="Tell us about your restaurant" />

      <Field label="Brand name">
        <input
          type="text"
          value={data.brandName}
          placeholder="e.g. Pasta & More"
          autoFocus
          onChange={e => update('brandName', e.target.value)}
          style={inputStyle(!!error)}
          onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-muted)'; }}
          onBlur={e => { e.target.style.borderColor = error ? 'var(--red)' : 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
        />
      </Field>

      <Field label="Restaurant type">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {RESTAURANT_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => update('restaurantType', t.value)}
              style={{
                padding: '12px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                textAlign: 'left', fontFamily: 'inherit',
                border: data.restaurantType === t.value ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-default)',
                background: data.restaurantType === t.value ? 'var(--accent-muted)' : 'var(--bg-surface)',
                transition: 'all var(--transition-base)',
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: 4 }}>{t.emoji}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: data.restaurantType === t.value ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{t.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </Field>

      <Field label={`Locations: ${data.locationCount === 50 ? '50+' : data.locationCount}`}>
        <Slider
          min={1} max={50} value={data.locationCount}
          onChange={v => update('locationCount', v)}
          showValue={false}
          minLabel="1" maxLabel="50+"
        />
      </Field>

      <Field label="Active platforms">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {PLATFORMS.map(p => {
            const active = data.platforms.includes(p.value);
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  const next = active
                    ? data.platforms.filter(x => x !== p.value)
                    : [...data.platforms, p.value];
                  update('platforms', next as Platform[]);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'inherit',
                  border: active ? `1.5px solid ${p.color}40` : '1px solid var(--border-subtle)',
                  background: active ? `${p.color}12` : 'var(--bg-surface)',
                  transition: 'all var(--transition-base)',
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: p.color, opacity: active ? 1 : 0.4,
                }} />
                <span style={{ fontSize: '13px', fontWeight: active ? 600 : 400, color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {p.label}
                </span>
                {active && <svg style={{ marginLeft: 'auto' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

// ── Step 2: Brand Voice ────────────────────────────────────────
function Step2({ data, update, analyzing, onAnalyze, newDescriptor, setNewDescriptor }: {
  data: WizardData;
  update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
  analyzing: boolean;
  onAnalyze: () => void;
  newDescriptor: string;
  setNewDescriptor: (v: string) => void;
}) {
  const addDescriptor = () => {
    const v = newDescriptor.trim();
    if (!v || data.toneDescriptors.includes(v)) return;
    update('toneDescriptors', [...data.toneDescriptors, v]);
    setNewDescriptor('');
  };

  const voicePreview = useMemo(() => {
    const formal    = data.formality > 60 ? 'We sincerely appreciate' : 'Thanks so much for';
    const warmth    = data.warmth    > 60 ? 'your kind words mean the world to us' : 'your feedback is valuable to us';
    const length    = data.verbosity > 60 ? 'We hope to welcome you back very soon and exceed your expectations once again.' : 'Hope to see you again soon!';
    return `Dear Guest, ${formal} taking the time to share your thoughts — ${warmth}. ${length}`;
  }, [data.formality, data.warmth, data.verbosity]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <StepHeader title="Brand Voice" subtitle="Help Olly write exactly like you" />

      <Field label="Paste 2–3 responses you've written">
        <textarea
          value={data.voiceSamples}
          onChange={e => update('voiceSamples', e.target.value)}
          placeholder={"Dear Priya, thank you so much for the kind words about our pasta…\n\nHi Rohit, we're sorry to hear your experience wasn't up to our usual standards…"}
          rows={5}
          style={{
            ...inputStyle(false), resize: 'vertical', lineHeight: 1.6,
            fontFamily: 'inherit', display: 'block', width: '100%', boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-muted)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
        />
      </Field>

      <Button
        variant="secondary" onClick={onAnalyze}
        disabled={!data.voiceSamples.trim() || analyzing}
        leftIcon={analyzing ? <Spinner size={14} /> : <span>✦</span>}
      >
        {analyzing ? 'Analyzing…' : 'Analyze my voice ✦'}
      </Button>

      {data.toneDescriptors.length > 0 && (
        <Field label="Voice descriptors">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.toneDescriptors.map(d => (
              <span key={d} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                borderRadius: '999px', fontSize: '12px', fontWeight: 500,
                background: 'var(--accent-muted)', border: '1px solid var(--accent-border)', color: 'var(--accent-primary)',
              }}>
                {d}
                <button type="button" onClick={() => update('toneDescriptors', data.toneDescriptors.filter(x => x !== d))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: 0, fontSize: '14px', lineHeight: 1, opacity: 0.7 }}>×</button>
              </span>
            ))}
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="text" value={newDescriptor} placeholder="+ Add"
                onChange={e => setNewDescriptor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addDescriptor()}
                style={{ ...inputStyle(false), width: 90, padding: '3px 10px', fontSize: '12px' }}
              />
            </div>
          </div>
        </Field>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {[
          { key: 'formality' as const,  label: 'Formality',  min: 'Relaxed',      max: 'Formal'    },
          { key: 'warmth'    as const,  label: 'Warmth',     min: 'Professional', max: 'Warm'      },
          { key: 'verbosity' as const,  label: 'Verbosity',  min: 'Brief',        max: 'Detailed'  },
        ].map(s => (
          <Field key={s.key} label={s.label}>
            <Slider
              min={0} max={100} value={data[s.key]}
              onChange={v => update(s.key, v)}
              showValue={false}
              minLabel={s.min} maxLabel={s.max}
            />
          </Field>
        ))}
      </div>

      {/* Live preview */}
      <div style={{
        padding: '14px 16px', borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Sample in your voice
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7, fontStyle: 'italic' }}>
          "{voicePreview}"
        </p>
      </div>
    </div>
  );
}

// ── Step 3: Brand Rules ────────────────────────────────────────
function Step3({ data, update }: { data: WizardData; update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void }) {
  const [newRule, setNewRule] = useState('');

  const addRule = (text: string) => {
    if (!text.trim() || data.rules.includes(text.trim())) return;
    update('rules', [...data.rules, text.trim()]);
  };

  const removeRule = (i: number) => {
    update('rules', data.rules.filter((_, idx) => idx !== i));
  };

  const moveRule = (i: number, dir: -1 | 1) => {
    const arr = [...data.rules];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update('rules', arr);
  };

  const unaddedSuggestions = RULE_SUGGESTIONS.filter(s => !data.rules.includes(s));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <StepHeader title="Brand Rules" subtitle="Guide Olly on the non-negotiables" />

      {/* Rules list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.rules.map((rule, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <span style={{ color: 'var(--accent-primary)', fontSize: '12px', flexShrink: 0 }}>✦</span>
            <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{rule}</span>
            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
              <ArrBtn onClick={() => moveRule(i, -1)} disabled={i === 0} title="Move up">↑</ArrBtn>
              <ArrBtn onClick={() => moveRule(i, 1)} disabled={i === data.rules.length - 1} title="Move down">↓</ArrBtn>
              <ArrBtn onClick={() => removeRule(i)} title="Remove" danger>×</ArrBtn>
            </div>
          </div>
        ))}

        {/* Add rule */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <input
            type="text"
            value={newRule}
            placeholder="Add a rule…"
            onChange={e => setNewRule(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { addRule(newRule); setNewRule(''); } }}
            style={{ ...inputStyle(false), flex: 1 }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-muted)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
          />
          <Button variant="secondary" size="sm" onClick={() => { addRule(newRule); setNewRule(''); }}>
            Add
          </Button>
        </div>
      </div>

      {/* Suggestions */}
      {unaddedSuggestions.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Suggestions
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {unaddedSuggestions.map(s => (
              <button key={s} type="button" onClick={() => addRule(s)} style={{
                padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontFamily: 'inherit',
                border: '1px solid var(--border-default)', background: 'var(--bg-surface)',
                color: 'var(--text-secondary)', cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}>
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Offer toggle */}
      <div style={{ paddingTop: 4 }}>
        <OfferToggle enabled={data.offerEnabled} text={data.offerText}
          onToggle={v => update('offerEnabled', v)}
          onText={v => update('offerText', v)} />
      </div>

      {/* Contact info */}
      <Field label="Contact info (for responses)">
        <textarea
          value={data.contactInfo}
          onChange={e => update('contactInfo', e.target.value)}
          placeholder="e.g. feedback@restaurant.com | +91-98765-43210"
          rows={2}
          style={{ ...inputStyle(false), display: 'block', width: '100%', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-muted)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
        />
      </Field>
    </div>
  );
}

function OfferToggle({ enabled, text, onToggle, onText }: { enabled: boolean; text: string; onToggle: (v: boolean) => void; onText: (v: string) => void }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <button type="button" onClick={() => onToggle(!enabled)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Recovery discount for 1–2 star reviews</div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>Automatically offer a remedy to unhappy guests</div>
        </div>
        <div style={{
          width: 36, height: 20, borderRadius: 999, flexShrink: 0,
          background: enabled ? 'var(--accent-primary)' : 'var(--bg-active)',
          position: 'relative', transition: 'background 0.2s',
        }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%', background: '#fff',
            position: 'absolute', top: 3, left: enabled ? 19 : 3,
            transition: 'left 0.2s',
          }} />
        </div>
      </button>
      <AnimatePresence>
        {enabled && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border-subtle)' }}>
              <textarea
                value={text}
                onChange={e => onText(e.target.value)}
                placeholder="e.g. We'd love to offer you a complimentary dessert on your next visit…"
                rows={2}
                autoFocus
                style={{ ...inputStyle(false), marginTop: 12, display: 'block', width: '100%', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-muted)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Step 4: All Set ────────────────────────────────────────────
function Step4({ data }: { data: WizardData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 24 }}>
      {/* Animated checkmark */}
      <div style={{ position: 'relative', width: 88, height: 88 }}>
        <svg viewBox="0 0 100 100" width={88} height={88}>
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--accent-muted)" strokeWidth="4" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke="var(--accent-primary)" strokeWidth="4"
            strokeDasharray="251" strokeDashoffset="251"
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ animation: 'check-circle 0.7s ease forwards' }}
          />
          <path
            d="M30 50 L45 65 L70 37"
            fill="none" stroke="var(--accent-primary)" strokeWidth="4"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="80" strokeDashoffset="80"
            style={{ animation: 'check-mark 0.4s ease 0.6s forwards' }}
          />
        </svg>
      </div>

      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 8px' }}>
          You're all set!
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Olly knows your brand. Let's start turning reviews into relationships.
        </p>
      </div>

      {/* Summary */}
      <div style={{
        width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)', padding: '16px 18px', textAlign: 'left',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <SummaryRow label="Brand" value={data.brandName || '—'} />
        <SummaryRow label="Platforms" value={
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {data.platforms.map(p => {
              const info = PLATFORMS.find(x => x.value === p);
              return (
                <span key={p} style={{
                  fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
                  background: `${info?.color ?? '#666'}18`, color: info?.color ?? 'var(--text-secondary)',
                  border: `1px solid ${info?.color ?? '#666'}30`,
                }}>
                  {info?.label ?? p}
                </span>
              );
            })}
          </div>
        } />
        {data.toneDescriptors.length > 0 && (
          <SummaryRow label="Voice" value={data.toneDescriptors.slice(0, 4).join(', ')} />
        )}
        <SummaryRow label="Rules" value={`${data.rules.length} rule${data.rules.length !== 1 ? 's' : ''} configured`} />
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────
function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 4px' }}>
        {title}
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{subtitle}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', width: 70, flexShrink: 0, paddingTop: 2 }}>{label}</span>
      <span style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1 }}>{value}</span>
    </div>
  );
}

function ArrBtn({ onClick, disabled, title, danger, children }: { onClick: () => void; disabled?: boolean; title?: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} style={{
      width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      color: danger ? 'var(--red)' : 'var(--text-tertiary)', opacity: disabled ? 0.3 : 1,
      fontSize: '13px', borderRadius: 4, transition: 'all var(--transition-fast)',
      fontFamily: 'inherit',
    }}>
      {children}
    </button>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%', boxSizing: 'border-box',
    padding: '9px 12px', fontSize: '14px',
    color: 'var(--text-primary)', background: 'var(--bg-surface)',
    border: `1px solid ${hasError ? 'var(--red)' : 'var(--border-default)'}`,
    borderRadius: 'var(--radius-md)', outline: 'none',
    transition: 'border-color var(--transition-base), box-shadow var(--transition-base)',
  };
}

export default BrandSetup;
