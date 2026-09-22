'use client';

import { motion } from 'motion/react';
import { CalendarDays, GraduationCap, UserRound } from 'lucide-react';
import { ChartCard } from '@/components/charts/chart-card';
import { BarChart } from '@/components/charts/bar-chart';
import { Card, CardHeader } from '@/components/ui/card';
import type { MonthReturn } from '@/types/officer-return';
import { formatDate, formatNumber } from '@/lib/format';

export function TrainingSection({ data }: { data: MonthReturn }) {
  const rows = data.sections.training?.rows ?? [];
  const delivered = rows.filter((r) => Number(r.participants) > 0 || r.date);
  const sorted = [...delivered].sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')));

  return (
    <>
      <ChartCard
        className="lg:col-span-6"
        title="Participants per programme"
        subtitle={`${data.kpis.trainingSessions} programmes · ${formatNumber(data.kpis.trainingParticipants)} participants`}
        icon={GraduationCap}
        table={{
          columns: [
            { key: 'label', label: 'Programme' },
            { key: 'date', label: 'Date', format: (v) => formatDate(v as string) },
            { key: 'participants', label: 'Participants', numeric: true, format: (v) => formatNumber(v as number) },
            { key: 'trainer', label: 'Trainer' },
            { key: 'remarks', label: 'Remarks' },
          ],
          rows,
        }}
      >
        <BarChart
          ariaLabel="Training participants per programme"
          data={rows}
          categoryWidth={140}
          series={[{ key: 'participants', label: 'Participants', slot: 0 }]}
          tooltipExtra={(row) => [row.trainer, formatDate(row.date as string)].filter((x) => x && x !== '—').join(' · ')}
        />
      </ChartCard>

      <Card className="lg:col-span-6">
        <CardHeader title="Training calendar" icon={CalendarDays} subtitle="Programmes in date order, as entered in the return" />
        {sorted.length ? (
          <ol className="relative m-5 space-y-4 border-l border-line pl-5">
            {sorted.map((row, i) => (
              <motion.li
                key={row.id}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="relative"
              >
                <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full bg-accent ring-4 ring-surface" aria-hidden />
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-sm font-medium text-ink">{row.label}</p>
                  <time className="tabular text-xs text-muted">{formatDate(row.date as string)}</time>
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-ink-2">
                  <span>{formatNumber(Number(row.participants))} participants</span>
                  {row.trainer && (
                    <span className="flex items-center gap-1">
                      <UserRound className="size-3" aria-hidden />
                      {String(row.trainer)}
                    </span>
                  )}
                </p>
                {row.remarks && <p className="mt-0.5 text-xs text-muted">{String(row.remarks)}</p>}
              </motion.li>
            ))}
          </ol>
        ) : (
          <p className="p-10 text-center text-sm text-muted">No training recorded this month.</p>
        )}
      </Card>
    </>
  );
}
