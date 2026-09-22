'use client';

import { motion } from 'motion/react';
import { BadgeCheck, Briefcase, ShieldCheck } from 'lucide-react';
import { ChartCard } from '@/components/charts/chart-card';
import { BarChart } from '@/components/charts/bar-chart';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge, toneForStatus } from '@/components/ui/badge';
import { MeterRow } from '@/components/ui/meter';
import type { MonthReturn } from '@/types/officer-return';
import { formatDate, formatNumber } from '@/lib/format';

const CHECKS = [
  { key: 'attendance', label: 'Attendance' },
  { key: 'wagePayment', label: 'Wages' },
  { key: 'pf', label: 'PF' },
  { key: 'esic', label: 'ESIC' },
  { key: 'lwfPt', label: 'LWF/PT' },
] as const;

export function ComplianceSection({ data }: { data: MonthReturn }) {
  const contractors = data.sections.contractors?.rows ?? [];
  const statutory = data.sections.compliance?.rows ?? [];
  const k = data.kpis;

  return (
    <>
      <ChartCard
        className="lg:col-span-5"
        title="Contract labour by contractor"
        subtitle={`${k.contractorCount} contractors · ${formatNumber(k.contractorManpower)} workers deployed`}
        icon={Briefcase}
        table={{
          columns: [
            { key: 'label', label: 'Contractor' },
            { key: 'manpower', label: 'Manpower', numeric: true, format: (v) => formatNumber(v as number) },
            { key: 'remarks', label: 'Remarks' },
          ],
          rows: contractors,
        }}
      >
        {contractors.length ? (
          <BarChart
            ariaLabel="Contract manpower by contractor"
            data={contractors}
            categoryWidth={160}
            series={[{ key: 'manpower', label: 'Manpower', slot: 0 }]}
            tooltipExtra={(row) => (row.remarks ? String(row.remarks) : null)}
          />
        ) : (
          <p className="py-10 text-center text-sm text-muted">No contractors listed this month.</p>
        )}
      </ChartCard>

      <Card className="lg:col-span-7">
        <CardHeader
          title="Contractor statutory compliance"
          icon={BadgeCheck}
          subtitle="Attendance, wage payment, PF, ESIC and LWF/PT per contractor"
        />
        <div className="px-5 pt-4">
          <MeterRow label="Checks passed" rate={k.contractorComplianceRate} />
        </div>
        <div className="mt-4 overflow-x-auto border-t border-line">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-surface-2/70 text-xs text-ink-2">
              <tr>
                <th scope="col" className="px-5 py-2.5 text-left font-medium">
                  Contractor
                </th>
                {CHECKS.map((c) => (
                  <th key={c.key} scope="col" className="px-2 py-2.5 text-center font-medium">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {contractors.map((row) => (
                <tr key={row.id} className="hover:bg-surface-2/50">
                  <th scope="row" className="px-5 py-2.5 text-left font-normal text-ink">
                    {row.label}
                  </th>
                  {CHECKS.map((c) => (
                    <td key={c.key} className="px-2 py-2.5 text-center">
                      <Badge tone={toneForStatus(row[c.key])}>{String(row[c.key] ?? '—')}</Badge>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="lg:col-span-12">
        <CardHeader
          title="Statutory compliance checklist"
          icon={ShieldCheck}
          subtitle={`${k.statutoryComplied} of ${k.statutoryTotal} requirements complied`}
        />
        <ul className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-2 xl:grid-cols-5">
          {statutory.map((row, i) => (
            <motion.li
              key={row.id}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface-2/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-ink">{row.label}</span>
                <Badge tone={toneForStatus(row.status)}>{String(row.status ?? 'Not recorded')}</Badge>
              </div>
              {row.dueDate && <span className="text-xs text-muted">Due {formatDate(String(row.dueDate))}</span>}
              {row.observation && <span className="text-xs text-ink-2">{String(row.observation)}</span>}
              {row.correctiveAction && <span className="text-xs text-ink-2">→ {String(row.correctiveAction)}</span>}
            </motion.li>
          ))}
        </ul>
      </Card>
    </>
  );
}
