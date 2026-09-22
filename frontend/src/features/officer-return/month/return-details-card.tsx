import { Card } from '@/components/ui/card';
import type { MonthReturn } from '@/types/officer-return';
import { formatNumber } from '@/lib/format';

/** The header block of the monthly return (factory, licence, period, officer). */
export function ReturnDetailsCard({ data, className }: { data: MonthReturn; className?: string }) {
  const h = data.header;
  const items = [
    { label: 'Reporting period', value: h.reportingPeriod },
    { label: 'Welfare officer', value: h.welfareOfficer },
    { label: 'Factory licence no.', value: h.licenceNo },
    { label: 'Total workers (declared)', value: h.declaredTotalWorkers ? formatNumber(h.declaredTotalWorkers) : null },
  ];

  return (
    <Card className={className}>
      <dl className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
        {items.map((item) => (
          <div key={item.label} className="px-5 py-4">
            <dt className="text-xs text-muted">{item.label}</dt>
            <dd className="mt-1 truncate text-sm font-medium text-ink" title={item.value ?? undefined}>
              {item.value || <span className="font-normal text-muted">Not filled</span>}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
