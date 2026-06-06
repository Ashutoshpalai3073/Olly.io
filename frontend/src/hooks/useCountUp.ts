import { useState, useEffect, useRef } from 'react';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const frameRef   = useRef<number>();
  const startRef   = useRef<number | null>(null);
  const prevTarget = useRef<number>(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;
    startRef.current   = null;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    const from = value;
    const diff = target - from;

    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed  = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(from + easeOutCubic(progress) * diff));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  return value;
}

export default useCountUp;
