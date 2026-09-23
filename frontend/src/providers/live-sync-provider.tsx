'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSWRConfig } from 'swr';
import { endpoints, isBackendKey } from '@/lib/api';
import { useToast } from './toast-provider';
import type { MonthKey } from '@/types/officer-return';

export type LiveConnection = 'connecting' | 'live' | 'offline';

interface LiveSyncState {
  connection: LiveConnection;
  syncing: boolean;
  lastEventAt: string | null;
}

const LiveSyncContext = createContext<LiveSyncState>({ connection: 'connecting', syncing: false, lastEventAt: null });

const MONTH_NAMES: Record<MonthKey, string> = {
  apr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', aug: 'Aug', sep: 'Sep',
  oct: 'Oct', nov: 'Nov', dec: 'Dec', jan: 'Jan', feb: 'Feb', mar: 'Mar',
};

/**
 * Subscribes to the backend's Server-Sent Events. When the backend ingests a new
 * revision of the Drive workbook, every cached API response is revalidated, so the
 * charts update without a page reload.
 */
export function LiveSyncProvider({ children }: { children: React.ReactNode }) {
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const [state, setState] = useState<LiveSyncState>({ connection: 'connecting', syncing: false, lastEventAt: null });

  useEffect(() => {
    const source = new EventSource(endpoints.events);

    source.onopen = () => setState((s) => ({ ...s, connection: 'live' }));
    source.onerror = () =>
      setState((s) => ({ ...s, connection: source.readyState === EventSource.CLOSED ? 'offline' : 'connecting' }));

    source.addEventListener('sync-started', () => setState((s) => ({ ...s, syncing: true })));

    source.addEventListener('sync-completed', (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        label?: string;
        changedItems: string[];
        syncedAt: string;
      };
      setState((s) => ({ ...s, syncing: false, lastEventAt: data.syncedAt }));
      mutate(isBackendKey);
      if (data.changedItems.length) {
        const months = data.changedItems.filter((i) => i in MONTH_NAMES).map((i) => MONTH_NAMES[i as MonthKey]);
        toast({
          tone: 'success',
          title: `${data.label ?? 'Dashboard'} updated from Google Drive`,
          description: months.length ? `Changes in ${months.join(', ')}` : 'New data synced',
        });
      }
    });

    source.addEventListener('sync-failed', (event) => {
      const data = JSON.parse((event as MessageEvent).data) as { label?: string; error: string };
      setState((s) => ({ ...s, syncing: false }));
      mutate(endpoints.syncStatus);
      toast({ tone: 'error', title: `${data.label ?? 'Sync'} failed`, description: data.error });
    });

    return () => source.close();
  }, [mutate, toast]);

  return <LiveSyncContext.Provider value={state}>{children}</LiveSyncContext.Provider>;
}

export const useLiveSync = () => useContext(LiveSyncContext);
