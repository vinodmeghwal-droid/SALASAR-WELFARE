'use client';

import useSWR from 'swr';
import { endpoints, type DatasetKey } from '@/lib/api';
import type { MonthKey, MonthReturn, Overview, SyncStatus } from '@/types/officer-return';
import type { InsightResponse } from '@/types/officer-return';
import type { AccidentOverview, IncidentsResponse } from '@/types/accident-tracker';

export function useOverview() {
  return useSWR<Overview>(endpoints.overview);
}

export function useMonthReturn(month: MonthKey | null) {
  return useSWR<MonthReturn>(month ? endpoints.month(month) : null);
}

export function useAccidentOverview() {
  return useSWR<AccidentOverview>(endpoints.accidentOverview);
}

export function useIncidents(month?: string) {
  return useSWR<IncidentsResponse>(endpoints.accidentIncidents(month));
}

/**
 * Gemini analysis for a view. The backend caches by data hash, so this is cheap after the
 * first call; a live sync revalidates it and a changed workbook produces fresh analysis.
 */
export function useInsights(dataset: DatasetKey, period: string) {
  return useSWR<InsightResponse>(endpoints.insights(dataset, period), {
    revalidateOnFocus: false,
    shouldRetryOnError: false, // the backend already falls back across models
  });
}

export function useSyncStatus() {
  // SSE drives refreshes; the interval only keeps "checked x ago" honest.
  return useSWR<SyncStatus>(endpoints.syncStatus, { refreshInterval: 60_000 });
}
