'use client';

import { motion } from 'motion/react';
import { fadeUp } from './card';
import { CountUp } from './count-up';
import { cn } from '@/lib/cn';

export interface StatTileProps {
  label: string;
  value: number | null | undefined;
  format?: (n: number) => string;
  icon: React.ComponentType<{ className?: string }>;
  /** Short secondary line, e.g. "124 closing · 11 joined". */
  detail?: React.ReactNode;
  /** Optional 0–100 meter under the value. */
  meter?: { value: number | null; tone?: 'good' | 'warning' | 'critical' | 'accent' };
  className?: string;
}

const METER_TONE = { good: 'bg-good', warning: 'bg-warning', critical: 'bg-critical', accent: 'bg-accent' };

export function StatTile({ label, value, format, icon: Icon, detail, meter, className }: StatTileProps) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn('group rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5', className)}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-ink-2">{label}</p>
        <span className="grid size-8 place-items-center rounded-lg bg-surface-2 text-ink-2 transition-colors group-hover:bg-accent-soft group-hover:text-accent-ink">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-ink sm:text-[32px]">
        <CountUp value={value} format={format} />
      </p>
      {meter && meter.value !== null && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3"
          role="meter"
          aria-valuenow={meter.value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <motion.div
            className={cn('h-full rounded-full', METER_TONE[meter.tone ?? 'accent'])}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, meter.value)}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      )}
      {detail && <p className="mt-2.5 text-xs text-muted">{detail}</p>}
    </motion.div>
  );
}
