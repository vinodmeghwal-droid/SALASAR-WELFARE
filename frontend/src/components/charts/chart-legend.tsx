import { cn } from '@/lib/cn';

export interface LegendItem {
  label: string;
  color: string;
  value?: React.ReactNode;
}

/** HTML legend: colored swatch carries identity, text stays in ink tokens. */
export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  if (items.length < 2) return null;
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-xs text-ink-2">
          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: item.color }} aria-hidden />
          {item.label}
          {item.value !== undefined && <span className="tabular font-medium text-ink">{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}
