'use client';

import { motion } from 'motion/react';
import { HardHat, Info, Stethoscope } from 'lucide-react';
import { ChartCard } from '@/components/charts/chart-card';
import { BarChart } from '@/components/charts/bar-chart';
import { useChartPalette } from '@/components/charts/use-chart-palette';
import { fadeUp } from '@/components/ui/card';
import type { MonthReturn } from '@/types/officer-return';
import { formatNumber } from '@/lib/format';

const fmt = (v: unknown) => formatNumber(v as number);

export function HealthSafetySection({ data }: { data: MonthReturn }) {
  const palette = useChartPalette();
  const health = data.sections.health?.rows ?? [];
  const accidents = data.sections.accidents?.rows ?? [];
  const notes = data.sections.accidents?.notes ?? [];
  const k = data.kpis;

  return (
    <>
      <ChartCard
        className="lg:col-span-6"
        title="Health & medical cases"
        subtitle={`${formatNumber(k.medicalCases)} entries this month · hover a bar for remarks`}
        icon={Stethoscope}
        table={{
          columns: [
            { key: 'label', label: 'Particular' },
            { key: 'count', label: 'Count', numeric: true, format: fmt },
            { key: 'remarks', label: 'Remarks' },
          ],
          rows: health,
        }}
      >
        <BarChart
          ariaLabel="Health and medical cases by type"
          data={health}
          categoryWidth={170}
          series={[{ key: 'count', label: 'Cases', slot: 0 }]}
          tooltipExtra={(row) => (row.remarks ? String(row.remarks) : null)}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-6"
        title="Accident statement"
        subtitle={`${k.reportableAccidents} accident(s) · ${k.nearMisses} near miss · ${k.manDaysLost} man-days lost`}
        icon={HardHat}
        legend={[
          { label: 'Cases', color: palette.series[0] },
          { label: 'Man-days lost', color: palette.series[1] },
        ]}
        table={{
          columns: [
            { key: 'label', label: 'Particular' },
            { key: 'cases', label: 'Cases', numeric: true, format: fmt },
            { key: 'manDaysLost', label: 'Man-days lost', numeric: true, format: fmt },
          ],
          rows: accidents,
        }}
        footer={
          notes.length > 0 && (
            <ul className="space-y-1">
              {notes.map((note) => (
                <li key={note} className="flex gap-2">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
                  {note.replace(/^observation:\s*/i, '')}
                </li>
              ))}
            </ul>
          )
        }
      >
        <BarChart
          ariaLabel="Accident cases and man-days lost by type"
          data={accidents}
          categoryWidth={170}
          series={[
            { key: 'cases', label: 'Cases', slot: 0 },
            { key: 'manDaysLost', label: 'Man-days lost', slot: 1 },
          ]}
        />
      </ChartCard>

      {k.safetyIncidents === 0 && (
        <motion.p variants={fadeUp} className="text-sm text-good-ink lg:col-span-12">
          No safety incidents recorded this month.
        </motion.p>
      )}
    </>
  );
}
