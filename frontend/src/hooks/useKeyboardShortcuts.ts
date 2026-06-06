import { useEffect, useCallback } from 'react';
import { useResponseStore } from '../store';

export interface ShortcutHandlers {
  onCommandPalette?: () => void;
  onUndo?:           () => void;
  onRedo?:           () => void;
  onConfirm?:        () => void;
  onEscape?:         () => void;
}

function isMod(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey;
}

function isEditorFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'textarea' || tag === 'input' || (el as HTMLElement).isContentEditable;
}

/**
 * Registers global keyboard shortcuts.
 * Call once at the top of a page/layout component.
 * Returns nothing — cleanup happens via the returned `useEffect` teardown.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}) {
  const undo = useResponseStore(s => s.undo);
  const redo = useResponseStore(s => s.redo);

  const onKey = useCallback((e: KeyboardEvent) => {
    // Cmd/Ctrl+K → command palette
    if (isMod(e) && e.key === 'k' && !e.shiftKey) {
      e.preventDefault();
      handlers.onCommandPalette?.();
      return;
    }

    // Cmd/Ctrl+Enter → confirm
    if (isMod(e) && e.key === 'Enter') {
      e.preventDefault();
      handlers.onConfirm?.();
      return;
    }

    // Escape → dismiss
    if (e.key === 'Escape') {
      handlers.onEscape?.();
      return;
    }

    // Undo/Redo only when editor is focused
    if (!isEditorFocused()) return;

    if (isMod(e) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handlers.onUndo?.() ?? undo();
      return;
    }

    if (isMod(e) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      handlers.onRedo?.() ?? redo();
      return;
    }
  }, [handlers, undo, redo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);
}
