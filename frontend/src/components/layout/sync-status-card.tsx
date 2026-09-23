'use client';

import { useEffect, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { useSyncStatus } from '@/hooks/use-officer-return';
import { useLiveSync } from '@/providers/live-sync-provider';
import { timeAgo } from '@/lib/format';
import { LiveDot } from './live-dot';

/** Sidebar footer: where the data comes from and how fresh each workbook is. */
export function SyncStatusCard() {
  const { data } = useSyncStatus();
  const { connection, syncing } = useLiveSync();
  const now = useNow(15_000);

  const datasets = data?.datasets ?? [];
  const errored = datasets.some((d) => d.status === 'error');
  const busy = syncing || datasets.some((d) => d.status === 'syncing');
  const label = busy ? 'Syncing…' : errored ? 'Sync error' : connection === 'live' ? 'Live' : 'Reconnecting…';
  const source = datasets[0]?.source === 'local' ? 'Local files' : 'Google Drive';

  return (
    <div className="rounded-xl border border-line bg-surface-2/60 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-ink">
        <LiveDot state={errored ? 'error' : busy ? 'syncing' : connection} />
        {label}
        <span className="ml-auto text-muted">{source}</span>
      </div>

      <ul className="mt-2 space-y-2">
        {datasets.map((dataset) => (
          <li key={dataset.key} className="flex items-start gap-2">
            <FileSpreadsheet
              className={`mt-0.5 size-4 shrink-0 ${dataset.status === 'error' ? 'text-critical-ink' : 'text-good-ink'}`}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="truncate text-xs text-ink-2" title={dataset.fileName ?? dataset.label}>
                {dataset.label}
              </p>
              <p className="text-[11px] text-muted">
                Edited {timeAgo(dataset.sourceModifiedTime, now)} · checked {timeAgo(dataset.lastCheckedAt, now)}
              </p>
              {dataset.error && <p className="mt-0.5 line-clamp-2 text-[11px] text-critical-ink">{dataset.error}</p>}
            </div>
          </li>
        ))}
      </ul>
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
