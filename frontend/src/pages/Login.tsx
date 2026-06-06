import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store';
import { Button } from '../components/ui/Button';

// ── Animated mesh background ────────────────────────────────────
const MESH_CSS = `
@keyframes olly-blob-1 {
  0%,100% { transform: translate(0,0) scale(1); }
  33%      { transform: translate(60px,-40px) scale(1.08); }
  66%      { transform: translate(-30px,25px) scale(0.94); }
}
@keyframes olly-blob-2 {
  0%,100% { transform: translate(0,0) scale(1); }
  40%      { transform: translate(-50px,35px) scale(1.06); }
  70%      { transform: translate(40px,-20px) scale(0.96); }
}
@keyframes olly-blob-3 {
  0%,100% { transform: translate(0,0) scale(1); }
  50%      { transform: translate(25px,50px) scale(1.1); }
}
`;

function MeshBackground() {
  return (
    <>
      <style>{MESH_CSS}</style>
      {[
        { top: '-10%',  left: '-5%',  size: 600, color: 'rgba(255,107,53,0.07)', anim: 'olly-blob-1 18s ease-in-out infinite' },
        { top: '55%',   right: '-8%', size: 500, color: 'rgba(59,130,246,0.05)', anim: 'olly-blob-2 22s ease-in-out infinite' },
        { bottom: '-5%',left: '35%',  size: 450, color: 'rgba(255,107,53,0.05)', anim: 'olly-blob-3 16s ease-in-out infinite' },
      ].map((b, i) => (
        <div key={i} style={{
          position: 'fixed',
          top: b.top, left: b.left, right: b.right, bottom: b.bottom,
          width: b.size, height: b.size,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${b.color}, transparent 70%)`,
          animation: b.anim,
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(40px)',
        }} />
      ))}
    </>
  );
}

// ── OTP six-box input ───────────────────────────────────────────
function OtpInput({
  value, onChange, onPaste, onKeyDown, inputRef, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onPaste?: React.ClipboardEventHandler;
  onKeyDown?: React.KeyboardEventHandler;
  inputRef?: (el: HTMLInputElement | null) => void;
  disabled?: boolean;
}) {
  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={1}
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(-1))}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      style={{
        width: 48, height: 56,
        textAlign: 'center',
        fontSize: '22px',
        fontWeight: 700,
        fontFamily: "'Geist Mono', monospace",
        letterSpacing: 0,
        color: 'var(--text-primary)',
        background: 'var(--bg-surface)',
        border: `1.5px solid ${value ? 'var(--accent-primary)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-md)',
        outline: 'none',
        transition: 'border-color var(--transition-base), box-shadow var(--transition-base)',
        caretColor: 'var(--accent-primary)',
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-muted)'; }}
      onBlur={e  => { if (!value) e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

// ── Page ────────────────────────────────────────────────────────
type Step = 'email' | 'otp';

export function Login() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  const [step,    setStep]    = useState<Step>('email');
  const [email,   setEmail]   = useState('');
  const [otp,     setOtp]     = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const emailRef  = useRef<HTMLInputElement>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!user && !profile) return;
    if (!profile?.brand_name) navigate('/setup', { replace: true });
    else navigate('/dashboard', { replace: true });
  }, [user, profile, navigate]);

  // Resend countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({ email: trimmed });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep('otp');
    setCountdown(60);
    setOtp(Array(6).fill(''));
    setTimeout(() => inputRefs.current[0]?.focus(), 150);
  };

  const handleVerify = useCallback(async (code: string) => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code,
      type:  'email',
    });
    if (err) {
      setLoading(false);
      setError('Invalid code — please try again');
      setOtp(Array(6).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
      return;
    }
    // Check if new user (no brand setup)
    if (data.user) {
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('brand_name')
        .eq('id', data.user.id)
        .single();
      setLoading(false);
      navigate(profileRow?.brand_name ? '/dashboard' : '/setup', { replace: true });
    } else {
      setLoading(false);
      navigate('/dashboard', { replace: true });
    }
  }, [email, navigate]);

  const handleOtpChange = (index: number, value: string) => {
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every(d => d !== '')) handleVerify(next.join(''));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    const next = Array(6).fill('').map((_, i) => digits[i] ?? '');
    setOtp(next);
    const focusIdx = Math.min(digits.length, 5);
    inputRefs.current[focusIdx]?.focus();
    if (digits.length === 6) handleVerify(digits);
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase() });
    setLoading(false);
    setCountdown(60);
    setOtp(Array(6).fill(''));
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <MeshBackground />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, padding: '0 20px' }}>

        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              {/* Logo */}
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
                  <span style={{
                    fontSize: '40px', fontWeight: 800, letterSpacing: '-0.05em',
                    color: 'var(--text-primary)', lineHeight: 1,
                  }}>
                    Olly
                  </span>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    display: 'inline-block',
                    marginBottom: 24,
                    boxShadow: '0 0 12px var(--accent-primary)',
                  }} />
                </div>
                <h1 style={{
                  fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em',
                  color: 'var(--text-primary)', margin: '0 0 8px',
                }}>
                  Manage your reputation, effortlessly
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                  AI-powered responses for every review,<br />in your brand's voice
                </p>
              </div>

              {/* Email form */}
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xl)',
                padding: 28,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      Work email
                    </label>
                    <input
                      ref={emailRef}
                      type="email"
                      value={email}
                      autoFocus
                      placeholder="you@restaurant.com"
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit',
                        color: 'var(--text-primary)', background: 'var(--bg-surface)',
                        border: `1px solid ${error ? 'var(--red)' : 'var(--border-default)'}`,
                        borderRadius: 'var(--radius-md)', outline: 'none',
                        transition: 'border-color var(--transition-base), box-shadow var(--transition-base)',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-muted)'; }}
                      onBlur={e => { e.target.style.borderColor = error ? 'var(--red)' : 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                      <p style={{ fontSize: '12px', color: 'var(--red)', margin: 0 }}>{error}</p>
                    </motion.div>
                  )}

                  <Button variant="primary" fullWidth onClick={handleSendOtp} loading={loading}>
                    Send code
                  </Button>

                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
                    We'll send a 6-digit code — no password needed.
                  </p>
                </div>
              </div>
            </motion.div>

          ) : (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', margin: '0 auto 16px',
                  background: 'var(--accent-muted)', border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 6px' }}>
                  Check your inbox
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  We sent a 6-digit code to<br />
                  <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
                </p>
              </div>

              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xl)',
                padding: 28,
              }}>
                {/* OTP boxes */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                  {otp.map((digit, i) => (
                    <OtpInput
                      key={i}
                      value={digit}
                      disabled={loading}
                      inputRef={el => { inputRefs.current[i] = el; }}
                      onChange={v => handleOtpChange(i, v)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                    />
                  ))}
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: '12px', color: 'var(--red)', margin: 0, textAlign: 'center' }}>{error}</p>
                  </motion.div>
                )}

                {loading && (
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 12, margin: '0 0 12px' }}>
                    Verifying…
                  </p>
                )}

                {/* Resend */}
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  {countdown > 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      Resend code in <strong style={{ color: 'var(--text-secondary)' }}>{countdown}s</strong>
                    </span>
                  ) : (
                    <button type="button" onClick={handleResend} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '12px', color: 'var(--accent-primary)', fontFamily: 'inherit',
                      textDecoration: 'underline', textUnderlineOffset: 2,
                    }}>
                      Resend code
                    </button>
                  )}
                </div>
              </div>

              {/* Back */}
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(''); setOtp(Array(6).fill('')); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'inherit',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  Use a different email
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Login;
