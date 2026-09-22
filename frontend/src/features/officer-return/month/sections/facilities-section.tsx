'use client';

import { motion } from 'motion/react';
import {
  Accessibility,
  Ambulance,
  Baby,
  Bath,
  Cross,
  Droplets,
  Hospital,
  Shirt,
  Sofa,
  Toilet,
  UtensilsCrossed,
  Warehouse,
} from 'lucide-react';
import { fadeUp } from '@/components/ui/card';
import { Badge, toneForStatus } from '@/components/ui/badge';
import type { MonthReturn } from '@/types/officer-return';

const ICONS: [RegExp, React.ComponentType<{ className?: string }>][] = [
  [/canteen/i, UtensilsCrossed],
  [/drinking|water/i, Droplets],
  [/wash/i, Bath],
  [/rest|shelter/i, Sofa],
  [/first-?aid/i, Cross],
  [/medical/i, Hospital],
  [/ambulance|transport/i, Ambulance],
  [/toilet/i, Toilet],
  [/changing/i, Shirt],
  [/creche|crèche/i, Baby],
  [/access/i, Accessibility],
];

const iconFor = (label: string) => ICONS.find(([re]) => re.test(label))?.[1] ?? Warehouse;

export function FacilitiesSection({ data }: { data: MonthReturn }) {
  const rows = data.sections.facilities?.rows ?? [];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-12 xl:grid-cols-5">
      {rows.map((row) => {
        const Icon = iconFor(row.label);
        return (
          <motion.article
            key={row.id}
            variants={fadeUp}
            whileHover={{ y: -2 }}
            className="flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-surface-2 text-ink-2">
                <Icon className="size-[18px]" aria-hidden />
              </span>
              <div className="flex flex-col items-end gap-1">
                <Badge tone={toneForStatus(row.available)}>{row.available ? `Available: ${row.available}` : 'Not recorded'}</Badge>
                {row.condition && <Badge tone={toneForStatus(row.condition)}>{row.condition}</Badge>}
              </div>
            </div>
            <h4 className="mt-3 text-sm font-semibold text-ink">{row.label}</h4>
            {row.capacity !== null && row.capacity !== undefined && row.capacity !== '' && (
              <p className="text-xs text-muted">Capacity: {String(row.capacity)}</p>
            )}
            {(row.observation || row.actionRequired) && (
              <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-xs">
                {row.observation && (
                  <div>
                    <dt className="sr-only">Observation</dt>
                    <dd className="text-ink-2">{String(row.observation)}</dd>
                  </div>
                )}
                {row.actionRequired && (
                  <div className="flex gap-1">
                    <dt className="font-medium text-ink">Action:</dt>
                    <dd className="text-ink-2">{String(row.actionRequired)}</dd>
                  </div>
                )}
              </dl>
            )}
          </motion.article>
        );
      })}
    </div>
  );
}
