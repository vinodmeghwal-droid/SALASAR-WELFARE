import type { MonthKey } from '@/types/officer-return';

/** All browser → backend traffic goes through the authenticated Next.js proxy. */
const BASE = '/api/backend';

export type DatasetKey = 'officer-return' | 'accident-tracker';

export const endpoints = {
  overview: `${BASE}/officer-return/overview`,
  month: (month: MonthKey) => `${BASE}/officer-return/months/${month}`,
  accidentOverview: `${BASE}/accident-tracker/overview`,
  accidentIncidents: (month?: string) =>
    `${BASE}/accident-tracker/incidents${month && month !== 'annual' ? `?month=${month}` : ''}`,
  insights: (dataset: DatasetKey, period: string, refresh = false) =>
    `${BASE}/insights?dataset=${dataset}&period=${period}${refresh ? '&refresh=1' : ''}`,
  syncStatus: `${BASE}/sync/status`,
  sync: `${BASE}/sync`,
  events: `${BASE}/events`,
} as const;

export const isBackendKey = (key: unknown) => typeof key === 'string' && key.startsWith(BASE);

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, body.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export interface SyncResult {
  dataset: DatasetKey;
  label?: string;
  changed: boolean;
  changedItems?: string[];
  error?: string;
}

/** Syncs every workbook, or just one when `dataset` is given. */
export async function triggerSync(force = false, dataset?: DatasetKey) {
  const res = await fetch(endpoints.sync, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ force, dataset }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, body.error ?? 'Sync failed');
  }
  return res.json() as Promise<{ results: SyncResult[] }>;
}
