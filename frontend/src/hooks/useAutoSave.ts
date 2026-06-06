import { useState, useEffect, useRef, useCallback } from 'react';

export interface AutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  saveNow: () => Promise<void>;
}

export function useAutoSave(
  value: string,
  saveFn: () => Promise<void>,
  delay = 3000,
): AutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFnRef  = useRef(saveFn);
  const prevRef    = useRef(value); // skip save if unchanged

  /* Keep saveFn ref fresh without including it in deps */
  useEffect(() => { saveFnRef.current = saveFn; }, [saveFn]);

  const save = useCallback(async () => {
    if (prevRef.current === value && lastSaved !== null) return; // no change
    setIsSaving(true);
    try {
      await saveFnRef.current();
      prevRef.current = value;
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  }, [value, lastSaved]);

  /* Schedule auto-save whenever value changes */
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void save(), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay, save]);

  /* Cancel on unmount */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { isSaving, lastSaved, saveNow: save };
}

export default useAutoSave;
