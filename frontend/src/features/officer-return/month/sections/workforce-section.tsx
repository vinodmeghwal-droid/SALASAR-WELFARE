'use client';

import { ChartCard } from '@/components/charts/chart-card';
import { BarChart } from '@/components/charts/bar-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { useChartPalette } from '@/components/charts/use-chart-palette';
import type { MonthReturn } from '@/types/officer-return';
import { formatNumber, formatPercent } from '@/lib/format';

const fmt = (v: unknown) => formatNumber(v as number);

export function WorkforceSection({ data }: { data: MonthReturn }) {
  const palette = useChartPalette();
  const rows = data.sections.manpower?.rows ?? [];
  const byType = rows.filter((r) => r.group === 'type');
  const byGender = rows.filter((r) => r.group === 'gender');
  const withRates = byType.map((r) => {
    const avg = (Number(r.opening) + Number(r.closing)) / 2;
    return { ...r, attrition: avg ? (Number(r.separation) / avg) * 100 : null };
  });

  const table = {
    columns: [
      { key: 'label', label: 'Category' },
      { key: 'opening', label: 'Opening', numeric: true, format: fmt },
      { key: 'joining', label: 'Joining', numeric: true, format: fmt },
      { key: 'separation', label: 'Separation', numeric: true, format: fmt },
      { key: 'closing', label: 'Closing', numeric: true, format: fmt },
      { key: 'attrition', label: 'Attrition', numeric: true, format: (v: unknown) => formatPercent(v as number | null, 1) },
    ],
    rows: [...withRates, ...byGender],
  };

  return (
    <>
      <ChartCard
        className="lg:col-span-5"
        title="Headcount by category"
        subtitle="Opening vs closing strength"
        legend={[
          { label: 'Opening', color: palette.series[0] },
          { label: 'Closing', color: palette.series[1] },
        ]}
        table={table}
      >
        <BarChart
          ariaLabel="Opening and closing headcount by employment category"
          data={byType}
          orientation="vertical"
          height={260}
          series={[
            { key: 'opening', label: 'Opening', slot: 0 },
            { key: 'closing', label: 'Closing', slot: 1 },
          ]}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-4"
        title="Joinings vs separations"
        subtitle="Movement during the month"
        legend={[
          { label: 'Joining', color: palette.series[0] },
          { label: 'Separation', color: palette.series[1] },
        ]}
        table={table}
      >
        <BarChart
          ariaLabel="Joinings and separations by employment category"
          data={withRates}
          categoryWidth={132}
          series={[
            { key: 'joining', label: 'Joining', slot: 0 },
            { key: 'separation', label: 'Separation', slot: 1 },
          ]}
          tooltipExtra={(row) => `Attrition ${formatPercent(row.attrition as number | null, 1)}`}
        />
      </ChartCard>

      <ChartCard className="lg:col-span-3" title="Gender split" subtitle="Closing headcount" table={table}>
        <DonutChart
          ariaLabel="Closing headcount by gender"
          centerLabel="workers"
          slices={byGender.map((r, i) => ({ label: r.label.replace(/ workers/i, ''), value: Number(r.closing), slot: i }))}
        />
      </ChartCard>
    </>
  );
}
