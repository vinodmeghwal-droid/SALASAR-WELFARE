'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumber, formatPercent } from '@/lib/format';
import { ChartTooltip } from './chart-tooltip';
import { useChartPalette } from './use-chart-palette';

export interface DonutSlice {
  label: string;
  value: number;
  slot: number;
}

/** Part-to-whole for ≤ 4 parts, with the total in the hole and an exact-value legend beside it. */
export function DonutChart({
  slices,
  centerLabel,
  ariaLabel,
}: {
  slices: DonutSlice[];
  centerLabel: string;
  ariaLabel: string;
}) {
  const palette = useChartPalette();
  const total = slices.reduce((s, x) => s + x.value, 0);
  const data = slices.map((s) => ({ ...s, name: s.label, fullLabel: s.label }));

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6 lg:flex-col 2xl:flex-row">
      <div role="img" aria-label={ariaLabel} className="relative size-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={86}
              paddingAngle={slices.length > 1 ? 2 : 0}
              cornerRadius={4}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              animationDuration={800}
            >
              {data.map((slice) => (
                <Cell key={slice.label} fill={palette.series[slice.slot]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-semibold tracking-tight text-ink">{formatNumber(total)}</p>
            <p className="text-[11px] text-muted">{centerLabel}</p>
          </div>
        </div>
      </div>

      <ul className="w-full space-y-2">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: palette.series[slice.slot] }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-ink-2">{slice.label}</span>
            <span className="tabular font-medium text-ink">{formatNumber(slice.value)}</span>
            <span className="tabular w-12 text-right text-xs text-muted">
              {formatPercent(total ? (slice.value / total) * 100 : null)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
