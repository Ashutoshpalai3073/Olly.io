import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TabItem {
  key: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (key: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function Tabs({
  tabs,
  defaultTab,
  activeTab,
  onChange,
  className = '',
  style,
}: TabsProps) {
  const firstKey = tabs[0]?.key ?? '';
  const [internal, setInternal] = useState(defaultTab ?? firstKey);
  const isControlled = activeTab !== undefined;
  const current = isControlled ? (activeTab as string) : internal;

  const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tabRefs.current[current];
    if (!el || !barRef.current) return;
    const barRect = barRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicator({ left: elRect.left - barRect.left, width: elRect.width });
  }, [current]);

  const select = (key: string) => {
    if (!isControlled) setInternal(key);
    onChange?.(key);
  };

  const currentContent = tabs.find((t) => t.key === current)?.content;

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {/* Tab bar */}
      <div
        ref={barRef}
        style={{
          position: 'relative',
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 20,
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === current;
          return (
            <button
              key={tab.key}
              ref={(el) => { tabRefs.current[tab.key] = el; }}
              onClick={() => !tab.disabled && select(tab.key)}
              disabled={tab.disabled}
              style={{
                padding: '9px 14px',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400,
                fontFamily: 'inherit',
                background: 'transparent',
                border: 'none',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                opacity: tab.disabled ? 0.4 : 1,
                transition: 'color var(--transition-base)',
                outline: 'none',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
            >
              {tab.label}
            </button>
          );
        })}

        {/* Sliding underline indicator */}
        <motion.span
          animate={{ left: indicator.left, width: indicator.width }}
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          style={{
            position: 'absolute',
            bottom: -1,
            height: 2,
            background: 'var(--accent-primary)',
            borderRadius: '1px',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Tab content with enter/exit animation */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{    opacity: 0, y: -5 }}
          transition={{ duration: 0.14 }}
        >
          {currentContent}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default Tabs;
