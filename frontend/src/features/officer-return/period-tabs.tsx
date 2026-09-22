'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ChartColumn } from 'lucide-react';
import type { MonthStatus, Period } from '@/types/officer-return';
import { cn } from '@/lib/cn';
import { MONTH_KEYS, MONTH_LABELS } from './periods';

/**
 * Annual Summary + one tab per FY month (mirrors the workbook tabs).
 * Filled dot = return submitted, hollow = awaiting data.
 */
export function PeriodTabs({
  value,
  onChange,
  months,
}: {
  value: Period;
  onChange: (p: Period) => void;
  months?: MonthStatus[];
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const status = Object.fromEntries((months ?? []).map((m) => [m.key, m]));

  // Keep the active tab in view on small screens; follow it with focus during arrow-key navigation.
  useEffect(() => {
    const list = listRef.current;
    const selected = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    if (list?.contains(document.activeElement)) selected?.focus();
  }, [value]);

  const tabs: { key: Period; label: string; hasData?: boolean }[] = [
    { key: 'annual', label: 'Annual Summary' },
    ...MONTH_KEYS.map((key) => ({ key, label: MONTH_LABELS[key].short, hasData: status[key]?.hasData })),
  ];

  return (
    <div className="sticky top-16 z-20 -mx-4 bg-bg/85 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div
        ref={listRef}
        role="tablist"
        aria-label="Reporting period"
        className="scrollbar-none flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1 shadow-card"
        onKeyDown={(e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          const index = tabs.findIndex((t) => t.key === value);
          const next = tabs[(index + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
          onChange(next.key);
          e.preventDefault();
        }}
      >
        {tabs.map((tab) => {
          const active = tab.key === value;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(tab.key)}
              title={tab.key === 'annual' ? 'Year to date' : tab.hasData ? 'Return submitted' : 'Awaiting data'}
              className={cn(
                'relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
                active ? 'text-white' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
              )}
            >
              {active && (
                <motion.span
                  layoutId="period-tab"
                  className="absolute inset-0 rounded-lg bg-accent shadow-card"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative flex items-center gap-1.5 font-medium">
                {tab.key === 'annual' ? (
                  <ChartColumn className="size-3.5" aria-hidden />
                ) : (
                  <span
                    aria-hidden
                    className={cn(
                      'size-1.5 rounded-full',
                      tab.hasData
                        ? active
                          ? 'bg-white'
                          : 'bg-good'
                        : cn('border', active ? 'border-white/70' : 'border-muted/60'),
                    )}
                  />
                )}
                {tab.label}
                {tab.key !== 'annual' && <span className="sr-only">{tab.hasData ? '(submitted)' : '(awaiting data)'}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
