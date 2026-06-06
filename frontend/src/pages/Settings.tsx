import { useState } from 'react';
import { Button }   from '../components/ui/Button';
import { Tabs }     from '../components/ui/Tabs';
import { Toggle }   from '../components/ui/Toggle';
import { Slider }   from '../components/ui/Slider';
import { Modal }    from '../components/ui/Modal';
import { useAuthStore, useUIStore } from '../store';
import { analyzeBrandVoice } from '../lib/api';

// ── Types ──────────────────────────────────────────────────────

type Role = 'Owner' | 'Editor' | 'Viewer';

interface TeamMember {
  id:    string;
  name:  string;
  email: string;
  role:  Role;
}

// ── Constants ──────────────────────────────────────────────────

const PLATFORMS = [
  { key: 'google',      label: 'Google',      color: '#4285F4', desc: 'Reviews imported from Google Business Profile' },
  { key: 'zomato',      label: 'Zomato',      color: '#E23744', desc: 'Reviews imported from your Zomato restaurant page' },
  { key: 'swiggy',      label: 'Swiggy',      color: '#FC8019', desc: 'Reviews imported from Swiggy Dineout & delivery' },
  { key: 'tripadvisor', label: 'TripAdvisor', color: '#00AA6C', desc: 'Reviews imported from your TripAdvisor listing' },
];

const RULE_SUGGESTIONS = [
  'Sign off with your manager\'s name',
  'For 1–2 star reviews, apologise first',
  'Include a specific remedy or next step',
  'Keep responses under 150 words',
  'Acknowledge specific dishes or staff mentioned',
];

const INITIAL_MEMBERS: TeamMember[] = [
  { id: 'u1', name: 'You',          email: 'you@example.com',  role: 'Owner'  },
  { id: 'u2', name: 'Priya Sharma', email: 'priya@example.com', role: 'Editor' },
];

const ROLE_COLORS: Record<Role, string> = {
  Owner:  'var(--accent-primary)',
  Editor: '#3b82f6',
  Viewer: 'var(--text-tertiary)',
};

// ── Helpers ────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </h3>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{children}</div>
      {hint && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: '20px 24px',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Brand Voice tab ────────────────────────────────────────────

function BrandVoiceTab() {
  const profile   = useAuthStore(s => s.profile);
  const updateProfile = useAuthStore(s => s.updateProfile);
  const addToast  = useUIStore(s => s.addToast);

  const [formality,  setFormality]  = useState(profile?.tone_formality  ?? 50);
  const [warmth,     setWarmth]     = useState(profile?.tone_warmth     ?? 60);
  const [verbosity,  setVerbosity]  = useState(profile?.tone_verbosity  ?? 45);
  const [voice,      setVoice]      = useState(profile?.brand_voice     ?? '');
  const [rules,      setRules]      = useState<string[]>(profile?.brand_rules ?? ['', '', '']);
  const [offer,      setOffer]      = useState(profile?.offer_template  ?? '');
  const [contact,    setContact]    = useState(profile?.contact_info    ?? '');
  const [samples,    setSamples]    = useState('');
  const [analyzing,  setAnalyzing]  = useState(false);
  const [saving,     setSaving]     = useState(false);

  const handleAnalyze = async () => {
    if (!samples.trim()) return;
    setAnalyzing(true);
    try {
      const res = await analyzeBrandVoice({
        sampleResponses: [samples],
        brandName: profile?.brand_name ?? 'my restaurant',
      });
      if (res.error || !res.data) throw new Error(res.error ?? 'No data returned');
      if (res.data.detectedTone)  setVoice(res.data.detectedTone);
      if (res.data.toneFormality) setFormality(res.data.toneFormality);
      if (res.data.toneWarmth)    setWarmth(res.data.toneWarmth);
      if (res.data.toneVerbosity) setVerbosity(res.data.toneVerbosity);
      addToast({ type: 'success', message: 'Voice re-analyzed' });
    } catch (e: unknown) {
      addToast({ type: 'error', message: 'Analysis failed', description: (e as Error).message });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const filtered = rules.filter(r => r.trim());
    const { error } = await updateProfile({
      brand_voice:    voice,
      brand_rules:    filtered,
      offer_template: offer,
      contact_info:   contact,
      tone_formality: formality,
      tone_warmth:    warmth,
      tone_verbosity: verbosity,
    });
    setSaving(false);
    if (error) {
      addToast({ type: 'error', message: 'Save failed', description: error });
    } else {
      addToast({ type: 'success', message: 'Brand voice saved' });
    }
  };

  const addRule = () => setRules(r => [...r, '']);
  const setRule = (i: number, v: string) => setRules(r => r.map((x, j) => j === i ? v : x));
  const removeRule = (i: number) => setRules(r => r.filter((_, j) => j !== i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Tone sliders */}
      <Card>
        <SectionTitle>Tone Settings</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <FieldLabel hint="How formal vs conversational the AI writes">Formality</FieldLabel>
            <Slider value={formality} min={0} max={100} onChange={setFormality} minLabel="Casual" maxLabel="Formal" />
          </div>
          <div>
            <FieldLabel hint="How warm and personal the tone feels">Warmth</FieldLabel>
            <Slider value={warmth} min={0} max={100} onChange={setWarmth} minLabel="Cool" maxLabel="Warm" />
          </div>
          <div>
            <FieldLabel hint="How brief vs detailed the responses are">Verbosity</FieldLabel>
            <Slider value={verbosity} min={0} max={100} onChange={setVerbosity} minLabel="Concise" maxLabel="Detailed" />
          </div>
        </div>
      </Card>

      {/* Voice description */}
      <Card>
        <SectionTitle>Brand Voice Description</SectionTitle>
        <FieldLabel hint="Describe how your brand speaks — used to guide the AI">
          Voice statement
        </FieldLabel>
        <textarea
          value={voice}
          onChange={e => setVoice(e.target.value)}
          rows={4}
          placeholder="e.g. We speak like a favourite local restaurant — warm, personal, and genuine…"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 12px',
            fontSize: '13px',
            fontFamily: 'inherit',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            resize: 'vertical',
            outline: 'none',
            lineHeight: 1.6,
          }}
        />

        <div style={{ marginTop: 16 }}>
          <FieldLabel hint="Paste 3–5 example responses you've written, one per paragraph">
            Re-analyze from samples
          </FieldLabel>
          <textarea
            value={samples}
            onChange={e => setSamples(e.target.value)}
            rows={4}
            placeholder="Paste example responses you've written before…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 12px',
              fontSize: '13px',
              fontFamily: 'inherit',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              resize: 'vertical',
              outline: 'none',
              lineHeight: 1.6,
            }}
          />
          <div style={{ marginTop: 8 }}>
            <Button
              variant="secondary"
              size="sm"
              loading={analyzing}
              disabled={!samples.trim()}
              onClick={handleAnalyze}
              leftIcon={analyzing ? undefined : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10" opacity="0.2"/>
                </svg>
              )}
            >
              {analyzing ? 'Analyzing…' : 'Re-analyze voice'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Rules */}
      <Card>
        <SectionTitle>Brand Rules</SectionTitle>
        <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
          Rules the AI will always follow when writing responses.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {rules.map((rule, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={rule}
                onChange={e => setRule(i, e.target.value)}
                placeholder={`Rule ${i + 1}`}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => removeRule(i)}
                title="Remove rule"
                style={{
                  width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                  border: 'none', background: 'transparent',
                  color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" onClick={addRule}>+ Add rule</Button>
          {RULE_SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => setRules(r => [...r, s])}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontFamily: 'inherit',
                background: 'var(--bg-active)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '999px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              + {s}
            </button>
          ))}
        </div>
      </Card>

      {/* Offer + contact */}
      <Card>
        <SectionTitle>Recovery Offer &amp; Contact</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <FieldLabel hint="Used in responses to 1–2 star reviews">Offer template</FieldLabel>
            <textarea
              value={offer}
              onChange={e => setOffer(e.target.value)}
              rows={3}
              placeholder="e.g. We'd love to offer you a complimentary dessert on your next visit…"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', fontSize: '13px', fontFamily: 'inherit',
                background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                resize: 'vertical', outline: 'none', lineHeight: 1.6,
              }}
            />
          </div>
          <div>
            <FieldLabel hint="Email, phone, or social handles for reviewers to reach you">Contact info</FieldLabel>
            <input
              value={contact}
              onChange={e => setContact(e.target.value)}
              placeholder="e.g. manager@restaurant.com | +91-98765-43210"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '8px 12px', fontSize: '13px', fontFamily: 'inherit',
                background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none',
              }}
            />
          </div>
        </div>
      </Card>

      {/* Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" loading={saving} onClick={handleSave}>
          Save brand voice
        </Button>
      </div>
    </div>
  );
}

// ── Platforms tab ──────────────────────────────────────────────

function PlatformsTab() {
  const profile    = useAuthStore(s => s.profile);
  const addToast   = useUIStore(s => s.addToast);
  const [connected, setConnected] = useState<Set<string>>(
    new Set(profile?.platforms ?? ['google']),
  );
  const [importText,   setImportText]   = useState('');
  const [importingFor, setImportingFor] = useState<string | null>(null);

  const toggle = (key: string) => {
    setConnected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    addToast({ type: 'success', message: connected.has(key) ? 'Platform disconnected' : 'Platform connected' });
  };

  const handleImport = (platformKey: string) => {
    if (!importText.trim()) return;
    setImportingFor(platformKey);
    setTimeout(() => {
      setImportingFor(null);
      setImportText('');
      addToast({ type: 'success', message: 'Reviews imported', description: 'Parsing complete. Reviews added to queue.' });
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {PLATFORMS.map(p => {
        const isOn = connected.has(p.key);
        return (
          <Card key={p.key}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              {/* Color dot as logo stand-in */}
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                background: `${p.color}22`,
                border: `1.5px solid ${p.color}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: p.color }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{p.label}</span>
                  {isOn && (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: '11px', fontWeight: 500,
                      color: '#22c55e',
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.2)',
                      borderRadius: '999px', padding: '2px 8px',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                      Reviews syncing
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{p.desc}</p>

                {!isOn && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Manual import — paste review data below, one review per line.
                    </p>
                    <textarea
                      value={importingFor === p.key ? importText : importText}
                      onChange={e => setImportText(e.target.value)}
                      rows={3}
                      placeholder={`Paste ${p.label} reviews here…`}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '8px 12px', fontSize: '12px', fontFamily: 'inherit',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        resize: 'vertical', outline: 'none', lineHeight: 1.5,
                        marginBottom: 8,
                      }}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={importingFor === p.key}
                      disabled={!importText.trim()}
                      onClick={() => handleImport(p.key)}
                    >
                      {importingFor === p.key ? 'Parsing…' : 'Parse & Import'}
                    </Button>
                  </div>
                )}
              </div>

              <Toggle
                checked={isOn}
                onChange={() => toggle(p.key)}
                style={{ flexShrink: 0, marginTop: 2 }}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ── Team tab ───────────────────────────────────────────────────

function TeamTab() {
  const addToast = useUIStore(s => s.addToast);
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [invite,  setInvite]  = useState('');
  const [role,    setRole]    = useState<Role>('Editor');
  const [sending, setSending] = useState(false);

  const handleInvite = async () => {
    if (!invite.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 900));
    setSending(false);
    setMembers(m => [...m, {
      id: String(Date.now()),
      name: invite.split('@')[0],
      email: invite,
      role,
    }]);
    setInvite('');
    addToast({ type: 'success', message: `Invite sent to ${invite}` });
  };

  const removeMember = (id: string) => {
    setMembers(m => m.filter(x => x.id !== id));
    addToast({ type: 'success', message: 'Member removed' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Invite */}
      <Card>
        <SectionTitle>Invite a team member</SectionTitle>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="email"
            value={invite}
            onChange={e => setInvite(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            placeholder="colleague@restaurant.com"
            style={{
              flex: '1 1 220px',
              padding: '8px 12px', fontSize: '13px', fontFamily: 'inherit',
              background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none',
            }}
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value as Role)}
            style={{
              padding: '8px 10px', fontSize: '13px', fontFamily: 'inherit',
              background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="Editor">Editor</option>
            <option value="Viewer">Viewer</option>
          </select>
          <Button
            variant="primary"
            size="md"
            loading={sending}
            disabled={!invite.trim()}
            onClick={handleInvite}
          >
            Send invite
          </Button>
        </div>
      </Card>

      {/* Member list */}
      <Card>
        <SectionTitle>Team members</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {members.map((m, i) => (
            <div
              key={m.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0',
                borderBottom: i < members.length - 1 ? '1px solid var(--border-subtle)' : undefined,
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--bg-active)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)',
                flexShrink: 0,
              }}>
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{m.email}</div>
              </div>
              {/* Role badge */}
              <span style={{
                padding: '3px 10px',
                fontSize: '11px', fontWeight: 600,
                color: ROLE_COLORS[m.role],
                background: `${ROLE_COLORS[m.role]}18`,
                border: `1px solid ${ROLE_COLORS[m.role]}33`,
                borderRadius: '999px',
                flexShrink: 0,
              }}>
                {m.role}
              </span>
              {m.role !== 'Owner' && (
                <button
                  onClick={() => removeMember(m.id)}
                  title="Remove member"
                  style={{
                    padding: '4px 8px', fontSize: '11px', fontFamily: 'inherit',
                    background: 'transparent', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-tertiary)',
                    cursor: 'pointer', transition: 'all var(--transition-fast)',
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Notifications tab ──────────────────────────────────────────

function NotificationsTab() {
  const addToast = useUIStore(s => s.addToast);
  const [newReview,    setNewReview]    = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [lowStar,      setLowStar]      = useState(true);
  const [saving,       setSaving]       = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    addToast({ type: 'success', message: 'Notification preferences saved' });
  };

  const Row = ({ label, hint, checked, onChange }: {
    label: string; hint?: string;
    checked: boolean; onChange: (v: boolean) => void;
  }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, padding: '14px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        {hint && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>{hint}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} style={{ flexShrink: 0 }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle>Email notifications</SectionTitle>
        <Row
          label="New review alert"
          hint="Receive an email whenever a new review is imported"
          checked={newReview}
          onChange={setNewReview}
        />
        <Row
          label="Weekly digest"
          hint="A summary of review activity every Monday morning"
          checked={weeklyDigest}
          onChange={setWeeklyDigest}
        />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, padding: '14px 0',
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Low-star alert
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>
              Alert me immediately for reviews under 3 stars
            </div>
          </div>
          <Toggle checked={lowStar} onChange={setLowStar} style={{ flexShrink: 0 }} />
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" loading={saving} onClick={handleSave}>
          Save preferences
        </Button>
      </div>
    </div>
  );
}

// ── Danger Zone tab ────────────────────────────────────────────

function DangerZoneTab() {
  const profile  = useAuthStore(s => s.profile);
  const addToast = useUIStore(s => s.addToast);

  const [deleteDataOpen,    setDeleteDataOpen]    = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [confirmText,       setConfirmText]       = useState('');
  const [loading,           setLoading]           = useState(false);

  const brandName = profile?.brand_name ?? 'My Brand';

  const handleDeleteData = async () => {
    if (confirmText !== 'DELETE') return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setDeleteDataOpen(false);
    setConfirmText('');
    addToast({ type: 'success', message: 'All review data deleted' });
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== brandName) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setDeleteAccountOpen(false);
    setConfirmText('');
    addToast({ type: 'success', message: 'Account deletion scheduled' });
  };

  const DangerButton = ({ label, desc, onClick }: { label: string; desc: string; onClick: () => void }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, padding: '16px 0',
      borderBottom: '1px solid rgba(239,68,68,0.12)',
    }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)' }}>{label}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>{desc}</div>
      </div>
      <Button variant="danger" size="sm" onClick={onClick}>{label}</Button>
    </div>
  );

  return (
    <>
      <div style={{
        background: 'rgba(239,68,68,0.06)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Danger Zone
          </span>
        </div>

        <DangerButton
          label="Delete all reviews data"
          desc="Permanently remove all reviews and responses. Cannot be undone."
          onClick={() => { setConfirmText(''); setDeleteDataOpen(true); }}
        />
        <div style={{ padding: '16px 0 0' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)' }}>Delete account</div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>
            Permanently close your Olly account. Cannot be undone.
          </div>
          <div style={{ marginTop: 10 }}>
            <Button variant="danger" size="sm" onClick={() => { setConfirmText(''); setDeleteAccountOpen(true); }}>
              Delete account
            </Button>
          </div>
        </div>
      </div>

      {/* Delete data modal */}
      <Modal
        open={deleteDataOpen}
        onClose={() => setDeleteDataOpen(false)}
        title="Delete all review data"
        width={420}
        closeOnOverlay={false}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteDataOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              size="sm"
              loading={loading}
              disabled={confirmText !== 'DELETE'}
              onClick={handleDeleteData}
            >
              Yes, delete everything
            </Button>
          </>
        }
      >
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          This will permanently delete <strong>all reviews, responses, and analytics data</strong> associated with your account. This action cannot be undone.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
          Type <strong>DELETE</strong> to confirm:
        </p>
        <input
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder="DELETE"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '8px 12px', fontSize: '13px', fontFamily: 'inherit',
            background: 'var(--bg-primary)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none',
          }}
        />
      </Modal>

      {/* Delete account modal */}
      <Modal
        open={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
        title="Delete account"
        width={420}
        closeOnOverlay={false}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteAccountOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              size="sm"
              loading={loading}
              disabled={confirmText !== brandName}
              onClick={handleDeleteAccount}
            >
              Delete my account
            </Button>
          </>
        }
      >
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Your account and all associated data will be permanently deleted. This cannot be reversed.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
          Type <strong>{brandName}</strong> to confirm:
        </p>
        <input
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder={brandName}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '8px 12px', fontSize: '13px', fontFamily: 'inherit',
            background: 'var(--bg-primary)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none',
          }}
        />
      </Modal>
    </>
  );
}

// ── Main page ───────────────────────────────────────────────────

export function Settings() {
  const TABS = [
    { key: 'voice',         label: 'Brand Voice',  content: <BrandVoiceTab />    },
    { key: 'platforms',     label: 'Platforms',    content: <PlatformsTab />      },
    { key: 'team',          label: 'Team',         content: <TeamTab />           },
    { key: 'notifications', label: 'Notifications', content: <NotificationsTab /> },
    { key: 'danger',        label: 'Danger Zone',  content: <DangerZoneTab />     },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '28px 24px 48px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Settings
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Manage your brand configuration, platforms, and account
          </p>
        </div>

        <Tabs tabs={TABS} defaultTab="voice" />
      </div>
    </div>
  );
}

export default Settings;
