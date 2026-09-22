'use client';

import { motion } from 'motion/react';
import { CalendarDays, CircleCheck, CircleDashed } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { MonthStatus, Period } from '@/types/officer-return';
import { cn } from '@/lib/cn';

/** How many of the 12 monthly returns are in, with each month a shortcut to its view. */
export function SubmissionProgress({
  months,
  onSelect,
  className,
}: {
  months: MonthStatus[];
  onSelect: (p: Period) => void;
  className?: string;
}) {
  const submitted = months.filter((m) => m.hasData).length;

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-lg bg-accent-soft text-accent-ink">
            <CalendarDays className="size-4" aria-hidden />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-ink">Monthly returns submitted</h3>
            <p className="text-xs text-ink-2">
              <span className="font-semibold text-ink">{submitted}</span> of {months.length} ·{' '}
              {months.length - submitted} awaiting data from the welfare officer
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink-2">
          <span className="flex items-center gap-1.5">
            <CircleCheck className="size-3.5 text-good-ink" aria-hidden /> Submitted
          </span>
          <span className="flex items-center gap-1.5">
            <CircleDashed className="size-3.5 text-muted" aria-hidden /> Awaiting
          </span>
        </div>
      </div>

      <ol className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-12">
        {months.map((m, i) => (
          <li key={m.key}>
            <motion.button
              initial={{ opacity: 0, scaleY: 0.4 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: 0.15 + i * 0.03 }}
              onClick={() => onSelect(m.key)}
              title={`${m.label}: ${m.hasData ? 'submitted' : 'awaiting data'}`}
              className={cn(
                'group flex w-full flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-xs transition',
                m.hasData
                  ? 'bg-good-soft text-good-ink hover:ring-2 hover:ring-good/30'
                  : 'border border-dashed border-line-strong text-muted hover:border-accent hover:text-accent',
              )}
            >
              {m.hasData ? (
                <CircleCheck className="size-4" aria-hidden />
              ) : (
                <CircleDashed className="size-4" aria-hidden />
              )}
              <span className="font-medium">{m.short}</span>
              <span className="sr-only">{m.hasData ? 'submitted' : 'awaiting data'}</span>
            </motion.button>
          </li>
        ))}
      </ol>
    </Card>
  );
}
