'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/format';

/** Severity by threshold: ≥ 95 good, ≥ 80 warning, else critical. Paired with the % text, never color alone. */
export function toneForRate(rate: number | null) {
  if (rate === null) return 'neutral' as const;
  if (rate >= 95) return 'good' as const;
  if (rate >= 80) return 'warning' as const;
  return 'critical' as const;
}

const FILL = { good: 'bg-good', warning: 'bg-warning', critical: 'bg-critical', neutral: 'bg-muted' };
const TRACK = { good: 'bg-good-soft', warning: 'bg-warning-soft', critical: 'bg-critical-soft', neutral: 'bg-surface-3' };

export function MeterRow({ label, rate, detail }: { label: string; rate: number | null; detail?: string }) {
  const tone = toneForRate(rate);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-ink-2">{label}</span>
        <span className="tabular text-sm font-semibold text-ink">{formatPercent(rate)}</span>
      </div>
      <div
        className={cn('mt-1.5 h-2 overflow-hidden rounded-full', TRACK[tone])}
        role="meter"
        aria-label={label}
        aria-valuenow={rate ?? undefined}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className={cn('h-full rounded-full', FILL[tone])}
          initial={{ width: 0 }}
          whileInView={{ width: `${rate ?? 0}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {detail && <p className="mt-1 text-xs text-muted">{detail}</p>}
    </div>
  );
}
