'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import type { DataCheck } from '@/types/officer-return';
import { cn } from '@/lib/cn';

/** Surfaces inconsistencies found in the workbook (see backend/src/domain/officerReturn/dataChecks.js). */
export function DataChecksPanel({ checks, className }: { checks: DataCheck[]; className?: string }) {
  const [open, setOpen] = useState(true);
  const warnings = checks.filter((c) => c.severity === 'warning').length;

  return (
    <Card className={className}>
      <CardHeader
        title="Data checks"
        icon={warnings ? TriangleAlert : CircleCheck}
        subtitle={
          checks.length
            ? `${warnings} warning${warnings === 1 ? '' : 's'} · ${checks.length - warnings} note${checks.length - warnings === 1 ? '' : 's'} — the dashboard computes from the detail sections`
            : 'No inconsistencies found in the workbook'
        }
        actions={
          checks.length > 0 && (
            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-2 hover:bg-surface-2"
            >
              {open ? 'Hide' : 'Show'}
              <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
            </button>
          )
        }
      />
      <AnimatePresence initial={false}>
        {open && checks.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ul className="space-y-2 p-5 pt-4">
              {checks.map((check) => {
                const warning = check.severity === 'warning';
                const Icon = warning ? TriangleAlert : Info;
                return (
                  <li
                    key={check.id}
                    className={cn(
                      'flex gap-3 rounded-xl border p-3',
                      warning ? 'border-warning/30 bg-warning-soft/60' : 'border-line bg-surface-2/60',
                    )}
                  >
                    <Icon className={cn('mt-0.5 size-4 shrink-0', warning ? 'text-warning-ink' : 'text-accent')} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        <span className="sr-only">{warning ? 'Warning: ' : 'Note: '}</span>
                        {check.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{check.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      {!open || !checks.length ? <div className="h-5" /> : null}
    </Card>
  );
}
