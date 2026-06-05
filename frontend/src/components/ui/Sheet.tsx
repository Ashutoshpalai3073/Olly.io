import React, { useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  minHeight?: number | string;
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  minHeight = '40vh',
}: SheetProps) {
  const dragControls = useDragControls();

  /* Escape to close */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 998,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />

          {/* Panel */}
          <motion.div
            key="sheet-panel"
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 300) onClose();
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 35 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 999,
              background: 'var(--bg-elevated)',
              borderTop: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              boxShadow: 'var(--shadow-modal)',
              maxHeight: '90vh',
              minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Drag handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '12px 0 6px',
                cursor: 'grab',
                flexShrink: 0,
                touchAction: 'none',
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: '999px',
                  background: 'var(--border-strong)',
                  display: 'block',
                }}
              />
            </div>

            {title && (
              <div
                style={{
                  padding: '6px 20px 14px',
                  borderBottom: '1px solid var(--border-subtle)',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {title}
                </span>
              </div>
            )}

            <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
              {children}
            </div>

            {footer && (
              <div
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid var(--border-subtle)',
                  flexShrink: 0,
                }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default Sheet;
