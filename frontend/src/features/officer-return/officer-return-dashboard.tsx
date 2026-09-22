'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Building2, ExternalLink, MapPin, UserRound } from 'lucide-react';
import { useOverview } from '@/hooks/use-officer-return';
import { sheetTabUrl } from '@/config/sheet-links';
import { DashboardSkeleton, ErrorState } from '@/components/ui/states';
import type { Period } from '@/types/officer-return';
import { PeriodTabs } from './period-tabs';
import { AnnualView } from './annual/annual-view';
import { MonthView } from './month/month-view';
import { MONTH_LABELS } from './periods';

export function OfficerReturnDashboard({ initialPeriod }: { initialPeriod: Period }) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const { data: overview, error, isLoading, mutate } = useOverview();

  const selectPeriod = useCallback((next: Period) => {
    setPeriod(next);
    const url = new URL(window.location.href);
    if (next === 'annual') url.searchParams.delete('period');
    else url.searchParams.set('period', next);
    window.history.replaceState(null, '', url); // Next syncs this with its router state
  }, []);

  const sheetUrl = overview && sheetTabUrl(overview.source.fileId, period, overview.source.webViewLink);

  return (
    <div className="space-y-6">
      {/* Page header */}
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
            Welfare Officer Return
          </motion.h1>
          {overview && (
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2"
            >
              {overview.factory.name && (
                <li className="flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-muted" aria-hidden />
                  {overview.factory.name}
                </li>
              )}
              {overview.factory.address && (
                <li className="flex min-w-0 items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0 text-muted" aria-hidden />
                  <span className="truncate">{overview.factory.address}</span>
                </li>
              )}
              {overview.factory.welfareOfficer && (
                <li className="flex items-center gap-1.5">
                  <UserRound className="size-3.5 text-muted" aria-hidden />
                  {overview.factory.welfareOfficer}
                </li>
              )}
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
            Open {period === 'annual' ? 'workbook' : `${MONTH_LABELS[period].short} tab`}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
      </header>

      <PeriodTabs value={period} onChange={selectPeriod} months={overview?.months} />

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
            {period === 'annual' ? (
              <AnnualView overview={overview} onSelectMonth={selectPeriod} />
            ) : (
              <MonthView month={period} overview={overview} />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
