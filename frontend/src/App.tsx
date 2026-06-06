import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuthStore }   from './store';
import { AppShell }       from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ToastContainer } from './components/ui/ToastContainer';
import { CommandPalette } from './components/ui/CommandPalette';
import { DevModeBanner }  from './components/ui/DevModeBanner';
import { Shimmer }        from './components/ui/Shimmer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import type { NavItem } from './components/layout/AppShell';

// ── Lazy pages ─────────────────────────────────────────────────

const Login          = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const BrandSetup     = lazy(() => import('./pages/BrandSetup').then(m => ({ default: m.BrandSetup })));
const Dashboard      = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ReviewQueue    = lazy(() => import('./pages/ReviewQueue').then(m => ({ default: m.ReviewQueue })));
const ResponseEditor = lazy(() => import('./pages/ResponseEditor').then(m => ({ default: m.ResponseEditor })));
const Analytics      = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));
const Settings       = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

// ── Suspense fallback ──────────────────────────────────────────

function PageLoader() {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 260 }}>
        <Shimmer height={24} width={180} borderRadius={6} />
        <Shimmer height={16} borderRadius={4} />
        <Shimmer height={16} width={220} borderRadius={4} />
        <Shimmer height={16} width={140} borderRadius={4} />
      </div>
    </div>
  );
}

// ── Nav items ──────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    key:   'dashboard',
    label: 'Dashboard',
    path:  '/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3"  y="3"  width="7" height="7" rx="1"/>
        <rect x="14" y="3"  width="7" height="7" rx="1"/>
        <rect x="3"  y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    key:   'queue',
    label: 'Review Queue',
    path:  '/queue',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    key:   'analytics',
    label: 'Analytics',
    path:  '/analytics',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
      </svg>
    ),
  },
  {
    key:   'settings',
    label: 'Settings',
    path:  '/settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

// ── Page transition ────────────────────────────────────────────

function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0  }}
      exit={{    opacity: 0, y: -5 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}
    >
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </motion.div>
  );
}

// ── Shell wrapper ──────────────────────────────────────────────

function ShellLayout({ children }: { children: React.ReactNode }) {
  const profile = useAuthStore(s => s.profile);
  const user    = useAuthStore(s => s.user);

  const userName  = profile?.brand_name ?? user?.email ?? 'User';
  const userEmail = user?.email;

  return (
    <AppShell
      navItems={NAV_ITEMS}
      user={{ name: userName, email: userEmail }}
    >
      {children}
    </AppShell>
  );
}

// ── Root ───────────────────────────────────────────────────────

export default function App() {
  const location   = useLocation();
  const initialize = useAuthStore(s => s.initialize);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => { initialize(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useKeyboardShortcuts({
    onCommandPalette: () => setPaletteOpen(o => !o),
    onEscape:         () => setPaletteOpen(false),
  });

  return (
    <>
      <ToastContainer />
      <DevModeBanner />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>

          {/* ── Public ── */}
          <Route path="/login" element={<Page><Login /></Page>} />

          <Route path="/setup" element={
            <ProtectedRoute requireProfile={false}>
              <Page><BrandSetup /></Page>
            </ProtectedRoute>
          } />

          {/* ── Protected ── */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <ShellLayout><Page><Dashboard /></Page></ShellLayout>
            </ProtectedRoute>
          } />

          <Route path="/queue" element={
            <ProtectedRoute>
              <ShellLayout><Page><ReviewQueue /></Page></ShellLayout>
            </ProtectedRoute>
          } />

          <Route path="/editor/:reviewId" element={
            <ProtectedRoute>
              <ShellLayout><Page><ResponseEditor /></Page></ShellLayout>
            </ProtectedRoute>
          } />

          <Route path="/analytics" element={
            <ProtectedRoute>
              <ShellLayout><Page><Analytics /></Page></ShellLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <ShellLayout><Page><Settings /></Page></ShellLayout>
            </ProtectedRoute>
          } />

          {/* ── Redirects ── */}
          <Route path="/reviews" element={<Navigate to="/queue"     replace />} />
          <Route path="/"        element={<Navigate to="/dashboard" replace />} />
          <Route path="*"        element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </AnimatePresence>
    </>
  );
}
