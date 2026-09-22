'use client';

import { useEffect, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { useSyncStatus } from '@/hooks/use-officer-return';
import { useLiveSync } from '@/providers/live-sync-provider';
import { timeAgo } from '@/lib/format';
import { LiveDot } from './live-dot';

/** Sidebar footer: where the data comes from and how fresh it is. */
export function SyncStatusCard() {
  const { data } = useSyncStatus();
  const { connection, syncing } = useLiveSync();
  const now = useNow(15_000);

  const errored = data?.status === 'error';
  const label = syncing || data?.status === 'syncing' ? 'Syncing…' : errored ? 'Sync error' : connection === 'live' ? 'Live' : 'Reconnecting…';

  return (
    <div className="rounded-xl border border-line bg-surface-2/60 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-ink">
        <LiveDot state={errored ? 'error' : syncing ? 'syncing' : connection} />
        {label}
        <span className="ml-auto text-muted">{data?.source === 'local' ? 'Local file' : 'Google Drive'}</span>
      </div>
      <div className="mt-2 flex items-start gap-2">
        <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-good-ink" aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-xs text-ink-2" title={data?.fileName ?? undefined}>
            {data?.fileName ?? 'Workbook'}
          </p>
          <p className="text-[11px] text-muted">
            Edited {timeAgo(data?.sourceModifiedTime, now)} · checked {timeAgo(data?.lastCheckedAt, now)}
          </p>
        </div>
      </div>
      {errored && data?.error && <p className="mt-2 line-clamp-3 text-[11px] text-critical-ink">{data.error}</p>}
    </div>
  );
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
