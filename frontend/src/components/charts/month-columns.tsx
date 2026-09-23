'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber } from '@/lib/format';
import { ChartTooltip } from './chart-tooltip';
import type { SeriesSpec } from './bar-chart';
import { useChartPalette } from './use-chart-palette';

/**
 * April → March columns. Months without a submitted return have null values (a gap, not
 * a zero bar), a muted tick, and a "not submitted" tooltip.
 */
/** A month of any financial year: an id, a short label, and whether data exists for it. */
export interface MonthPoint {
  month: string;
  label: string;
  hasData: boolean;
  [metric: string]: string | number | boolean | null | undefined;
}

export function MonthColumns({
  data,
  series,
  stacked = false,
  height = 290,
  valueFormatter = formatNumber,
  ariaLabel,
}: {
  data: MonthPoint[];
  series: SeriesSpec[];
  stacked?: boolean;
  height?: number;
  valueFormatter?: (n: number) => string;
  ariaLabel: string;
}) {
  const palette = useChartPalette();
  const rows = data.map((d) => ({ ...d, fullLabel: d.label }));

  return (
    <div role="img" aria-label={ariaLabel} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} barGap={2} barCategoryGap={stacked ? '28%' : '10%'}>
          <CartesianGrid stroke={palette.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: palette.axis }}
            interval={0}
            height={32}
            tick={(tickProps) => {
              const props = tickProps as unknown as { x: number; y: number; payload: { value: string; index: number } };
              const point = data[props.payload.index];
              return (
                <text
                  x={props.x}
                  y={Number(props.y) + 12}
                  textAnchor="middle"
                  fontSize={11}
                  fill={point?.hasData ? palette.ink2 : palette.tick}
                  opacity={point?.hasData ? 1 : 0.55}
                  fontWeight={point?.hasData ? 600 : 400}
                >
                  {props.payload.value}
                </text>
              );
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={48}
            tick={{ fill: palette.tick, fontSize: 11 }}
            tickFormatter={(v: number) => formatNumber(v, { compact: true })}
          />
          <Tooltip
            cursor={{ fill: palette.empty, opacity: 0.7 }}
            content={<ChartTooltip valueFormatter={valueFormatter} showTotal={stacked} />}
          />
          {series.map((s, i) => {
            const isOuter = !stacked || i === series.length - 1;
            return (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={palette.series[s.slot]}
                stackId={stacked ? 'stack' : undefined}
                radius={isOuter ? [4, 4, 0, 0] : 0}
                stroke={stacked ? palette.surface : undefined}
                strokeWidth={stacked ? 1 : 0}
                maxBarSize={24}
                animationDuration={700}
                animationBegin={i * 80}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
