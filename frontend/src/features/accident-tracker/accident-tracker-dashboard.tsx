'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, ExternalLink, FileSpreadsheet } from 'lucide-react';
import { useAccidentOverview } from '@/hooks/use-officer-return';
import { accidentSheetUrl } from '@/config/sheet-links';
import { DashboardSkeleton, ErrorState } from '@/components/ui/states';
import { cn } from '@/lib/cn';
import { AccidentView } from './accident-view';

/** HR Welfare → Accident Tracker. Period tabs mirror the workbook's May→April year. */
export function AccidentTrackerDashboard({ initialPeriod }: { initialPeriod: string }) {
  const [period, setPeriod] = useState(initialPeriod);
  const { data: overview, error, isLoading, mutate } = useAccidentOverview();

  const selectPeriod = useCallback((next: string) => {
    setPeriod(next);
    const url = new URL(window.location.href);
    if (next === 'annual') url.searchParams.delete('period');
    else url.searchParams.set('period', next);
    window.history.replaceState(null, '', url);
  }, []);

  const sheetUrl = overview && accidentSheetUrl(overview.fileId, 'data', overview.webViewLink);
  const months = overview?.months ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-accent"
          >
            HR Welfare{overview ? ` · FY ${overview.fy}` : ''}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
          >
            Safety Accident & LTI Tracker
          </motion.h1>
          {overview && (
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2"
            >
              <li className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-muted" aria-hidden />
                {overview.reportingPeriod?.replace(/^Reporting Period:\s*/i, '').split('|')[0].trim() ??
                  `FY ${overview.fy}`}
              </li>
              <li className="flex items-center gap-1.5">
                <FileSpreadsheet className="size-3.5 text-muted" aria-hidden />
                {overview.totals.recordedEvents} incident{overview.totals.recordedEvents === 1 ? '' : 's'} recorded
              </li>
            </motion.ul>
          )}
        </div>
        {sheetUrl && (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink-2 shadow-card transition hover:text-ink"
          >
            Open tracker sheet
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
      </header>

      {/* Period tabs: Full year + each month of the workbook's year */}
      <div className="sticky top-16 z-20 -mx-4 bg-bg/85 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div
          role="tablist"
          aria-label="Reporting period"
          className="scrollbar-none flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1 shadow-card"
        >
          {[{ monthId: 'annual', label: 'Full year', hasData: true }, ...months].map((tab) => {
            const active = tab.monthId === period;
            return (
              <button
                key={tab.monthId}
                role="tab"
                aria-selected={active}
                onClick={() => selectPeriod(tab.monthId)}
                title={tab.monthId === 'annual' ? 'Year to date' : tab.hasData ? 'Incidents recorded' : 'No incidents recorded'}
                className={cn(
                  'relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
                  active ? 'text-white' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="accident-period-tab"
                    className="absolute inset-0 rounded-lg bg-accent shadow-card"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5 font-medium">
                  {tab.monthId !== 'annual' && (
                    <span
                      aria-hidden
                      className={cn(
                        'size-1.5 rounded-full',
                        tab.hasData ? (active ? 'bg-white' : 'bg-critical') : cn('border', active ? 'border-white/70' : 'border-muted/60'),
                      )}
                    />
                  )}
                  {tab.monthId === 'annual' ? 'Full year' : tab.label.replace(' 20', " '")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && !overview ? (
        <ErrorState message={error.message} onRetry={() => mutate()} />
      ) : isLoading || !overview ? (
        <DashboardSkeleton />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={period}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <AccidentView overview={overview} period={period} />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
