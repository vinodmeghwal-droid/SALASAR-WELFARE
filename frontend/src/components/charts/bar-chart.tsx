'use client';

import { Bar, BarChart as ReBarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber } from '@/lib/format';
import { ChartTooltip } from './chart-tooltip';
import { useChartPalette } from './use-chart-palette';

export interface SeriesSpec {
  key: string;
  label: string;
  /** 0-based categorical slot; assign in order, never cycle. */
  slot: number;
}

type Row = Record<string, unknown>;

/**
 * Category bar chart.
 * - orientation "horizontal": bars grow right, categories on the Y axis (long labels, ranked lists)
 * - orientation "vertical": columns grow up, categories on the X axis
 * Grouped by default; `stacked` stacks series (only the outermost segment gets the rounded end).
 */
export function BarChart({
  data,
  series,
  categoryKey = 'label',
  orientation = 'horizontal',
  stacked = false,
  height,
  categoryWidth = 150,
  valueFormatter = formatNumber,
  tooltipExtra,
  showValueLabels,
  ariaLabel,
}: {
  data: Row[];
  series: SeriesSpec[];
  categoryKey?: string;
  orientation?: 'horizontal' | 'vertical';
  stacked?: boolean;
  height?: number;
  categoryWidth?: number;
  valueFormatter?: (n: number) => string;
  tooltipExtra?: (row: Row) => React.ReactNode;
  /** Value at the bar tip. Defaults to on for single-series charts. */
  showValueLabels?: boolean;
  ariaLabel: string;
}) {
  const palette = useChartPalette();
  const horizontal = orientation === 'horizontal';
  const labelsOn = showValueLabels ?? (series.length === 1 || stacked);
  const perCategory = stacked ? 1 : series.length;
  const computedHeight = height ?? (horizontal ? Math.max(180, data.length * (perCategory * 14 + 20) + 36) : 280);

  const rows = data.map((row) => ({ ...row, fullLabel: row[categoryKey] }));
  const tick = { fill: palette.tick, fontSize: 11 };
  const endRadius: [number, number, number, number] = horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0];

  const valueAxis = {
    type: 'number' as const,
    tick,
    tickLine: false,
    axisLine: false,
    allowDecimals: false,
    tickFormatter: (v: number) => formatNumber(v, { compact: true }),
  };
  const categoryAxis = {
    type: 'category' as const,
    dataKey: categoryKey,
    tick,
    tickLine: false,
    axisLine: { stroke: palette.axis },
    interval: 0 as const,
    tickFormatter: (v: string) => truncate(v, horizontal ? 24 : 10),
  };

  return (
    <div role="img" aria-label={ariaLabel} style={{ height: computedHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart
          data={rows}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 4, right: labelsOn && horizontal ? 36 : 8, bottom: 0, left: horizontal ? 0 : -12 }}
          barGap={2}
          barCategoryGap={horizontal ? 8 : '24%'}
        >
          <CartesianGrid stroke={palette.grid} horizontal={!horizontal} vertical={horizontal} />
          {horizontal ? (
            <>
              <XAxis {...valueAxis} />
              <YAxis {...categoryAxis} width={categoryWidth} />
            </>
          ) : (
            <>
              <XAxis {...categoryAxis} height={36} />
              <YAxis {...valueAxis} width={48} />
            </>
          )}
          <Tooltip
            cursor={{ fill: palette.empty, opacity: 0.7 }}
            content={<ChartTooltip valueFormatter={valueFormatter} extra={tooltipExtra} showTotal={stacked} />}
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
                radius={isOuter ? endRadius : 0}
                maxBarSize={24}
                stroke={stacked ? palette.surface : undefined}
                strokeWidth={stacked ? 1 : 0}
                animationDuration={700}
                animationBegin={i * 80}
              >
                {labelsOn && isOuter && (
                  <LabelList
                    // Stacked: label the total at the outer end; otherwise the bar's own value.
                    valueAccessor={(entry) => {
                      const e = entry as { payload?: Row; value?: unknown };
                      return stacked
                        ? series.reduce((sum, x) => sum + Number(e.payload?.[x.key] ?? 0), 0)
                        : Number(e.value ?? 0);
                    }}
                    position={horizontal ? 'right' : 'top'}
                    fill={palette.ink2}
                    fontSize={11}
                    formatter={(v: unknown) => (typeof v === 'number' && v > 0 ? valueFormatter(v) : '')}
                  />
                )}
              </Bar>
            );
          })}
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}

function truncate(text: string, max: number) {
  const value = String(text ?? '');
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
