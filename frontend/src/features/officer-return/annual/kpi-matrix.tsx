'use client';

import { Table2 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import type { MonthKey, Overview, TrendPoint } from '@/types/officer-return';
import { formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';

type Kind = 'flow' | 'stock' | 'rate';

/** The workbook's Annual Summary, recomputed from each month's detail sections. */
const ROWS: { key: keyof TrendPoint; label: string; kind: Kind }[] = [
  { key: 'headcountClosing', label: 'Closing headcount', kind: 'stock' },
  { key: 'joinings', label: 'Joinings', kind: 'flow' },
  { key: 'separations', label: 'Separations', kind: 'flow' },
  { key: 'attritionRate', label: 'Attrition rate', kind: 'rate' },
  { key: 'welfareActivities', label: 'Welfare activities', kind: 'flow' },
  { key: 'inspections', label: 'Welfare inspections', kind: 'flow' },
  { key: 'grievancesReceived', label: 'Grievances received', kind: 'flow' },
  { key: 'grievancesResolved', label: 'Grievances resolved', kind: 'flow' },
  { key: 'safetyIncidents', label: 'Safety incidents', kind: 'flow' },
  { key: 'manDaysLost', label: 'Man-days lost', kind: 'flow' },
  { key: 'medicalCases', label: 'Medical cases', kind: 'flow' },
  { key: 'trainingSessions', label: 'Training programmes', kind: 'flow' },
  { key: 'trainingParticipants', label: 'Training participants', kind: 'flow' },
  { key: 'statutoryComplianceRate', label: 'Statutory compliance', kind: 'rate' },
];

export function KpiMatrix({
  overview,
  onSelectMonth,
  className,
}: {
  overview: Overview;
  onSelectMonth: (m: MonthKey) => void;
  className?: string;
}) {
  const { trend } = overview;
  const submitted = trend.filter((p) => p.hasData);

  const total = (key: keyof TrendPoint, kind: Kind) => {
    if (!submitted.length) return null;
    if (kind === 'flow') return submitted.reduce((s, p) => s + Number(p[key] ?? 0), 0);
    return (submitted.at(-1)?.[key] as number | null) ?? null; // stock & rate: latest month
  };
  const show = (value: unknown, kind: Kind) =>
    value === null || value === undefined ? '—' : kind === 'rate' ? formatPercent(value as number, 1) : formatNumber(value as number);

  return (
    <Card className={className}>
      <CardHeader
        title="KPI summary by month"
        icon={Table2}
        subtitle="Recomputed from each month's sections. Totals: sums for counts, latest month for headcount & rates. Click a month to open it."
      />
      <div className="mt-4 overflow-x-auto border-t border-line">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="bg-surface-2/70 text-xs text-ink-2">
              <th scope="col" className="sticky left-0 z-10 bg-surface-2 px-4 py-2.5 text-left font-medium">
                KPI
              </th>
              {trend.map((p) => (
                <th key={p.month} scope="col" className="px-2 py-2.5 text-right font-medium">
                  <button
                    onClick={() => onSelectMonth(p.month)}
                    className={cn('rounded px-1 hover:text-accent', !p.hasData && 'text-muted/70')}
                  >
                    {p.label}
                  </button>
                </th>
              ))}
              <th scope="col" className="px-4 py-2.5 text-right font-semibold text-ink">
                FY total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ROWS.map((row) => (
              <tr key={row.key} className="transition-colors hover:bg-surface-2/50">
                <th scope="row" className="sticky left-0 z-10 bg-surface px-4 py-2 text-left font-normal text-ink-2">
                  {row.label}
                </th>
                {trend.map((p) => (
                  <td
                    key={p.month}
                    className={cn('tabular px-2 py-2 text-right', p.hasData ? 'text-ink' : 'text-muted/50')}
                  >
                    {p.hasData ? show(p[row.key], row.kind) : '·'}
                  </td>
                ))}
                <td className="tabular px-4 py-2 text-right font-semibold text-ink">{show(total(row.key, row.kind), row.kind)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
