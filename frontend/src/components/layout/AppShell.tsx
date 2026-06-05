import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../ui/Avatar';

export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

export interface AppShellUser {
  name: string;
  email?: string;
  avatar?: string;
}

export interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  user?: AppShellUser;
}

const EXPANDED = 240;
const COLLAPSED = 56;
const MOBILE_BP = 768;

export function AppShell({ children, navItems, user }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < MOBILE_BP);
  const location = useLocation();

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < MOBILE_BP;
      setIsMobile(mobile);
      if (mobile) setCollapsed(false);
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* Close mobile drawer on route change */
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const sidebarWidth = !isMobile && collapsed ? COLLAPSED : EXPANDED;

  /* ── Shared sidebar content ────────────────────────────────── */
  const SidebarInner = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Logo row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          padding: '17px 14px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
          gap: 8,
          minHeight: 56,
        }}
      >
        {/* Wordmark / icon */}
        <span
          style={{
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: 'var(--accent-primary)',
            lineHeight: 1,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {collapsed && !isMobile ? 'O' : 'Olly'}
        </span>

        {/* Collapse button (desktop only) */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              color: 'var(--text-tertiary)',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background var(--transition-base), color var(--transition-base)',
            }}
          >
            {collapsed ? (
              /* chevron right */
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            ) : (
              /* chevron left */
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: '8px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path + '/'));

          return (
            <Link
              key={item.key}
              to={item.path}
              title={collapsed && !isMobile ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed && !isMobile ? '9px' : '8px 10px',
                justifyContent: collapsed && !isMobile ? 'center' : undefined,
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                marginBottom: 2,
                position: 'relative',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-muted)' : 'transparent',
                transition: 'background var(--transition-base), color var(--transition-base)',
                overflow: 'hidden',
              }}
            >
              {/* Active left-border accent */}
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '18%',
                    bottom: '18%',
                    width: 3,
                    borderRadius: '0 2px 2px 0',
                    background: 'var(--accent-primary)',
                  }}
                />
              )}

              {/* Icon */}
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  height: 20,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>

              {/* Label */}
              <AnimatePresence initial={false}>
                {(!collapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      overflow: 'hidden',
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 400,
                      whiteSpace: 'nowrap',
                      lineHeight: 1.4,
                    }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Badge */}
              {item.badge !== undefined && item.badge > 0 && (!collapsed || isMobile) && (
                <span
                  style={{
                    marginLeft: 'auto',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '999px',
                    minWidth: 18,
                    textAlign: 'center',
                    flexShrink: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: collapsed && !isMobile ? '10px' : '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed && !isMobile ? 'center' : undefined,
            gap: 10,
            flexShrink: 0,
          }}
        >
          <Avatar name={user.name} src={user.avatar} size="sm" />
          <AnimatePresence initial={false}>
            {(!collapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.12 }}
                style={{ overflow: 'hidden', minWidth: 0 }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.name}
                </div>
                {user.email && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-tertiary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.email}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* ── Desktop sidebar ──────────────────────────────────── */}
      {!isMobile && (
        <motion.aside
          animate={{ width: sidebarWidth }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          style={{
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-subtle)',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          <SidebarInner />
        </motion.aside>
      )}

      {/* ── Mobile hamburger ─────────────────────────────────── */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          style={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {/* ── Mobile drawer ────────────────────────────────────── */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <>
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                zIndex: 50,
              }}
            />
            <motion.aside
              key="drawer-panel"
              initial={{ x: -EXPANDED }}
              animate={{ x: 0 }}
              exit={{ x: -EXPANDED }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: EXPANDED,
                background: 'var(--bg-surface)',
                borderRight: '1px solid var(--border-default)',
                zIndex: 60,
              }}
            >
              <SidebarInner />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ─────────────────────────────────────── */}
      <main style={{ flex: 1, minWidth: 0, minHeight: '100vh', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

export default AppShell;
