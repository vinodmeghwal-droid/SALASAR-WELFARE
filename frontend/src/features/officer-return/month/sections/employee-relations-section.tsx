'use client';

import { Activity, MessageSquareWarning } from 'lucide-react';
import { ChartCard } from '@/components/charts/chart-card';
import { BarChart } from '@/components/charts/bar-chart';
import { useChartPalette } from '@/components/charts/use-chart-palette';
import { Card, CardHeader } from '@/components/ui/card';
import { MeterRow } from '@/components/ui/meter';
import type { MonthReturn } from '@/types/officer-return';
import { formatNumber } from '@/lib/format';

const fmt = (v: unknown) => formatNumber(v as number);

export function EmployeeRelationsSection({ data }: { data: MonthReturn }) {
  const palette = useChartPalette();
  const grievances = data.sections.grievances?.rows ?? [];
  const activities = data.sections.activities?.rows ?? [];
  const k = data.kpis;

  return (
    <>
      <ChartCard
        className="lg:col-span-7"
        title="Grievances by category"
        subtitle={`${k.grievancesReceived} received · ${k.grievancesResolved} resolved · ${k.grievancesPending} pending`}
        icon={MessageSquareWarning}
        legend={[
          { label: 'Resolved', color: palette.series[0] },
          { label: 'Pending', color: palette.series[1] },
        ]}
        table={{
          columns: [
            { key: 'label', label: 'Category' },
            { key: 'received', label: 'Received', numeric: true, format: fmt },
            { key: 'resolved', label: 'Resolved', numeric: true, format: fmt },
            { key: 'pending', label: 'Pending', numeric: true, format: fmt },
          ],
          rows: grievances,
        }}
      >
        <BarChart
          ariaLabel="Grievances by category, resolved and pending"
          data={grievances}
          stacked
          categoryWidth={150}
          series={[
            { key: 'resolved', label: 'Resolved', slot: 0 },
            { key: 'pending', label: 'Pending', slot: 1 },
          ]}
        />
      </ChartCard>

      <Card className="lg:col-span-5">
        <CardHeader title="Resolution & reach" icon={Activity} subtitle="Grievance closure and welfare-activity engagement" />
        <div className="space-y-5 p-5">
          <MeterRow
            label="Grievance resolution rate"
            rate={k.grievanceResolutionRate}
            detail={`${k.grievancesResolved} of ${k.grievancesReceived} resolved within the month`}
          />
          <dl className="grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
            {[
              ['Activities', k.welfareActivities],
              ['Participants', k.activityParticipants],
              ['Inspections', k.inspections],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-surface-2 px-2 py-3">
                <dd className="text-xl font-semibold text-ink">{formatNumber(value as number)}</dd>
                <dt className="text-[11px] text-muted">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      <ChartCard
        className="lg:col-span-12"
        title="Welfare officer activities"
        subtitle="Participants reached per activity · sessions, observations and actions in the tooltip and table"
        icon={Activity}
        table={{
          columns: [
            { key: 'label', label: 'Activity' },
            { key: 'conducted', label: 'Conducted', numeric: true, format: fmt },
            { key: 'participants', label: 'Participants', numeric: true, format: fmt },
            { key: 'observations', label: 'Observations' },
            { key: 'actionTaken', label: 'Action taken' },
          ],
          rows: activities,
        }}
      >
        <BarChart
          ariaLabel="Participants reached per welfare activity"
          data={activities}
          categoryWidth={170}
          series={[{ key: 'participants', label: 'Participants', slot: 0 }]}
          tooltipExtra={(row) => (
            <div className="space-y-1">
              <p>{formatNumber(Number(row.conducted))} session(s) conducted</p>
              {row.observations ? <p>{String(row.observations)}</p> : null}
              {row.actionTaken ? <p className="font-medium text-ink">→ {String(row.actionTaken)}</p> : null}
            </div>
          )}
        />
      </ChartCard>
    </>
  );
}
