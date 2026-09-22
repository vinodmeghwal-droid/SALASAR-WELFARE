'use client';

import useSWR from 'swr';
import { endpoints } from '@/lib/api';
import type { MonthKey, MonthReturn, Overview, SyncStatus } from '@/types/officer-return';

export function useOverview() {
  return useSWR<Overview>(endpoints.overview);
}

export function useMonthReturn(month: MonthKey | null) {
  return useSWR<MonthReturn>(month ? endpoints.month(month) : null);
}

export function useSyncStatus() {
  // SSE drives refreshes; the interval only keeps "checked x ago" honest.
  return useSWR<SyncStatus>(endpoints.syncStatus, { refreshInterval: 60_000 });
}
