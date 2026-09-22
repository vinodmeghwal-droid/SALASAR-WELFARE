'use client';

import useSWR from 'swr';
import { endpoints } from '@/lib/api';
import type { InsightResponse, MonthKey, MonthReturn, Overview, Period, SyncStatus } from '@/types/officer-return';

export function useOverview() {
  return useSWR<Overview>(endpoints.overview);
}

export function useMonthReturn(month: MonthKey | null) {
  return useSWR<MonthReturn>(month ? endpoints.month(month) : null);
}

/**
 * Gemini analysis for a period. The backend caches by data hash, so this is cheap after the
 * first call; a live sync revalidates it and a changed workbook produces fresh analysis.
 */
export function useInsights(period: Period) {
  return useSWR<InsightResponse>(endpoints.insights(period), {
    revalidateOnFocus: false,
    shouldRetryOnError: false, // the backend already falls back across models
  });
}

export function useSyncStatus() {
  // SSE drives refreshes; the interval only keeps "checked x ago" honest.
  return useSWR<SyncStatus>(endpoints.syncStatus, { refreshInterval: 60_000 });
}
