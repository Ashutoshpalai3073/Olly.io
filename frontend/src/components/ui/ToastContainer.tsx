import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store';
import { Toast } from './Toast';

/**
 * Store-driven toast display — reads from useUIStore.toasts.
 * Mount once near the root; no props required.
 */
export function ToastContainer() {
  const toasts     = useUIStore(s => s.toasts);
  const removeToast = useUIStore(s => s.removeToast);

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      style={{
        position:      'fixed',
        bottom:        24,
        left:          '50%',
        transform:     'translateX(-50%)',
        display:       'flex',
        flexDirection: 'column-reverse',
        alignItems:    'center',
        gap:           8,
        zIndex:        9999,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;
