import { formatNumber } from '@/lib/format';

interface TooltipEntry {
  name?: string | number;
  value?: number | string | null;
  color?: string;
  fill?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  valueFormatter?: (value: number) => string;
  /** Extra lines under the values, built from the hovered row (e.g. remarks). */
  extra?: (row: Record<string, unknown>) => React.ReactNode;
  /** Adds a "Total" line for stacked series. */
  showTotal?: boolean;
}

/** Recharts injects active/payload/label when passed as `content={<ChartTooltip … />}`. */
export function ChartTooltip({ active, payload, label, valueFormatter = formatNumber, extra, showTotal }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload ?? {};
  const title = (row.fullLabel as string) ?? label;
  const numeric = payload.filter((p) => typeof p.value === 'number');
  const total = numeric.reduce((sum, p) => sum + (p.value as number), 0);

  return (
    <div className="min-w-[160px] max-w-[280px] rounded-xl border border-line bg-surface px-3 py-2.5 text-xs shadow-pop">
      <p className="mb-1.5 font-semibold text-ink">{title}</p>
      {row.hasData === false ? (
        <p className="text-muted">Return not submitted yet</p>
      ) : (
        <ul className="space-y-1">
          {payload.map((entry) => (
            <li key={String(entry.dataKey)} className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-[3px]"
                style={{ background: entry.color ?? entry.fill }}
                aria-hidden
              />
              <span className="text-ink-2">{entry.name}</span>
              <span className="tabular ml-auto pl-3 font-medium text-ink">
                {typeof entry.value === 'number' ? valueFormatter(entry.value) : '—'}
              </span>
            </li>
          ))}
          {showTotal && numeric.length > 1 && (
            <li className="mt-1 flex border-t border-line pt-1">
              <span className="text-ink-2">Total</span>
              <span className="tabular ml-auto font-semibold text-ink">{valueFormatter(total)}</span>
            </li>
          )}
        </ul>
      )}
      {extra && row.hasData !== false && <div className="mt-2 border-t border-line pt-2 text-ink-2">{extra(row)}</div>}
    </div>
  );
}
