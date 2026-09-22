'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChartColumn, Table2 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { ChartLegend, type LegendItem } from './chart-legend';

export interface TableSpec {
  columns: { key: string; label: string; numeric?: boolean; format?: (v: unknown) => React.ReactNode }[];
  rows: Record<string, unknown>[];
}

/**
 * Chart container: title, subtitle, legend, and a chart ⇄ table toggle.
 * The table view is the accessible (and exact-number) alternative to every chart.
 */
export function ChartCard({
  title,
  subtitle,
  icon,
  legend,
  table,
  footer,
  className,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  legend?: LegendItem[];
  table?: TableSpec;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart');

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        actions={table && <ViewToggle view={view} onChange={setView} />}
      />
      {legend && view === 'chart' && <ChartLegend items={legend} className="px-5 pt-3" />}
      <div className="relative flex-1 px-3 pb-4 pt-3 sm:px-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {view === 'chart' || !table ? children : <DataTable {...table} />}
          </motion.div>
        </AnimatePresence>
      </div>
      {footer && <div className="border-t border-line px-5 py-3 text-xs text-ink-2">{footer}</div>}
    </Card>
  );
}

function ViewToggle({ view, onChange }: { view: 'chart' | 'table'; onChange: (v: 'chart' | 'table') => void }) {
  return (
    <div className="flex rounded-lg bg-surface-2 p-0.5" role="group" aria-label="Display as">
      {(
        [
          ['chart', ChartColumn, 'Chart view'],
          ['table', Table2, 'Table view'],
        ] as const
      ).map(([key, Icon, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          aria-pressed={view === key}
          title={label}
          className={cn(
            'grid size-7 place-items-center rounded-md transition',
            view === key ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink',
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}

export function DataTable({ columns, rows }: TableSpec) {
  return (
    <div className="max-h-[360px] overflow-auto rounded-lg border border-line">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-surface-2 text-ink-2">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn('px-3 py-2 font-medium', c.numeric && 'text-right')}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-surface-2/50">
              {columns.map((c) => (
                <td key={c.key} className={cn('px-3 py-2 text-ink', c.numeric && 'tabular text-right')}>
                  {c.format ? c.format(row[c.key]) : ((row[c.key] as React.ReactNode) ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
