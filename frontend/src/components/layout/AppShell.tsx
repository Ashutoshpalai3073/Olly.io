import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ──────────────────────────────────────────────────────

export interface NavItem {
  key:    string;
  label:  string;
  icon:   React.ReactNode;
  path:   string;
  badge?: number;
}

export interface AppShellProps {
  children:  React.ReactNode;
  navItems:  NavItem[];
  brandName?: string;
}

// ── Constants ──────────────────────────────────────────────────

const EXPANDED   = 240;
const COLLAPSED  = 56;
const MOBILE_BP  = 768;

// ── Pulsing dot CSS ────────────────────────────────────────────

const PULSE_CSS = `
@keyframes olly-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.55); }
  50%       { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
}
.olly-pulse-dot {
  animation: olly-pulse 2s ease-in-out infinite;
}
`;

let pulseInjected = false;
function ensurePulseStyle() {
  if (pulseInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = PULSE_CSS;
  document.head.appendChild(el);
  pulseInjected = true;
}

// ── Component ──────────────────────────────────────────────────

export function AppShell({ children, navItems, brandName }: AppShellProps) {
  ensurePulseStyle();

  const location    = useLocation();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile]     = useState(
    typeof window !== 'undefined' && window.innerWidth < MOBILE_BP,
  );

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < MOBILE_BP;
      setIsMobile(mobile);
      if (mobile) setCollapsed(false);
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isCollapsed  = !isMobile && collapsed;
  const sidebarWidth = isCollapsed ? COLLAPSED : EXPANDED;

  // ── Sidebar content ──────────────────────────────────────────

  const SidebarInner = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Logo row ── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        padding:        '16px 12px 13px',
        borderBottom:   '1px solid var(--border-subtle)',
        flexShrink:     0,
        gap:            8,
        minHeight:      56,
      }}>
        <AnimatePresence initial={false} mode="wait">
          {isCollapsed ? (
            <motion.div
              key="logo-icon"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 3 }}
            >
              <span style={{
                width: 9, height: 9, borderRadius: '50%',
                background: 'var(--accent-primary)',
                boxShadow: '0 0 0 3px rgba(255,107,53,0.2)',
              }} />
            </motion.div>
          ) : (
            <motion.div
              key="logo-text"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}
            >
              <span style={{
                width: 9, height: 9, borderRadius: '50%',
                background: 'var(--accent-primary)',
                boxShadow:  '0 0 0 3px rgba(255,107,53,0.2)',
                flexShrink: 0,
              }} />
              <span style={{
                fontSize:      '18px',
                fontWeight:    800,
                letterSpacing: '-0.04em',
                color:         'var(--text-primary)',
                lineHeight:    1,
                whiteSpace:    'nowrap',
              }}>
                Olly
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse toggle (desktop) */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              width:          26,
              height:         26,
              borderRadius:   'var(--radius-sm)',
              background:     'transparent',
              color:          'var(--text-tertiary)',
              border:         'none',
              cursor:         'pointer',
              flexShrink:     0,
              transition:     'background var(--transition-base), color var(--transition-base)',
            }}
          >
            {collapsed ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map(item => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path + '/'));

          return (
            <Link
              key={item.key}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            10,
                padding:        isCollapsed ? '9px' : '8px 10px',
                justifyContent: isCollapsed ? 'center' : undefined,
                borderRadius:   'var(--radius-md)',
                textDecoration: 'none',
                marginBottom:   2,
                position:       'relative',
                color:     isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-muted)'  : 'transparent',
                fontWeight: isActive ? 600 : 400,
                transition: 'background var(--transition-base), color var(--transition-base)',
                overflow:   'hidden',
              }}
            >
              {isActive && (
                <span style={{
                  position:     'absolute',
                  left:         0,
                  top:          '18%',
                  bottom:       '18%',
                  width:        3,
                  borderRadius: '0 2px 2px 0',
                  background:   'var(--accent-primary)',
                }} />
              )}

              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, flexShrink: 0 }}>
                {item.icon}
              </span>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{    opacity: 0, width: 0     }}
                    transition={{ duration: 0.12 }}
                    style={{ overflow: 'hidden', fontSize: '14px', whiteSpace: 'nowrap', lineHeight: 1.4 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {item.badge !== undefined && item.badge > 0 && !isCollapsed && (
                <span style={{
                  marginLeft:   'auto',
                  background:   'var(--accent-primary)',
                  color:        '#fff',
                  fontSize:     '10px',
                  fontWeight:   700,
                  padding:      '1px 5px',
                  borderRadius: '999px',
                  minWidth:     18,
                  textAlign:    'center',
                  flexShrink:   0,
                  lineHeight:   1.6,
                }}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Auto-reply status indicator ── */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              margin:       '0 8px 6px',
              padding:      '8px 10px',
              borderRadius: 'var(--radius-md)',
              background:   'rgba(34,197,94,0.08)',
              border:       '1px solid rgba(34,197,94,0.18)',
              display:      'flex',
              alignItems:   'center',
              gap:          8,
            }}
          >
            <span
              className="olly-pulse-dot"
              style={{
                width:        8,
                height:       8,
                borderRadius: '50%',
                background:   '#22c55e',
                flexShrink:   0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#22c55e', lineHeight: 1.2 }}>
                Olly is active
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
                Auto-reply on
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Brand footer ── */}
      {brandName && !isCollapsed && (
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          padding:   '10px 12px',
          flexShrink: 0,
        }}>
          <div style={{
            fontSize:     '12px',
            fontWeight:   500,
            color:        'var(--text-tertiary)',
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
          }}>
            {brandName}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <motion.aside
          animate={{ width: sidebarWidth }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          style={{
            background:   'var(--bg-surface)',
            borderRight:  '1px solid var(--border-subtle)',
            flexShrink:   0,
            position:     'sticky',
            top:          0,
            height:       '100vh',
            overflow:     'hidden',
            zIndex:       10,
          }}
        >
          <SidebarInner />
        </motion.aside>
      )}

      {/* ── Mobile hamburger ── */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          style={{
            position:       'fixed',
            top:            12,
            left:           12,
            zIndex:         100,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:          36,
            height:         36,
            borderRadius:   'var(--radius-md)',
            background:     'var(--bg-surface)',
            border:         '1px solid var(--border-default)',
            color:          'var(--text-primary)',
            cursor:         'pointer',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <>
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{    opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileOpen(false)}
              style={{
                position:             'fixed',
                inset:                0,
                background:           'rgba(0,0,0,0.5)',
                backdropFilter:       'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                zIndex:               50,
              }}
            />
            <motion.aside
              key="drawer-panel"
              initial={{ x: -EXPANDED }}
              animate={{ x: 0 }}
              exit={{    x: -EXPANDED }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              style={{
                position:    'fixed',
                left:        0,
                top:         0,
                bottom:      0,
                width:       EXPANDED,
                background:  'var(--bg-surface)',
                borderRight: '1px solid var(--border-default)',
                zIndex:      60,
              }}
            >
              <SidebarInner />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <main style={{ flex: 1, minWidth: 0, minHeight: '100vh', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

export default AppShell;
