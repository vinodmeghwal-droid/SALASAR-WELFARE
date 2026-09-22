'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import { formatNumber } from '@/lib/format';

/** Animates a number from its previous value (0 on mount) to `value`. */
export function CountUp({
  value,
  format = (n) => formatNumber(Math.round(n)),
}: {
  value: number | null | undefined;
  format?: (n: number) => string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (value === null || value === undefined) return;
    if (reduce) {
      setDisplay(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setDisplay,
    });
    from.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  if (value === null || value === undefined) return <>—</>;
  return <>{format(display)}</>;
}
