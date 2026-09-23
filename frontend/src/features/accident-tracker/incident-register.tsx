'use client';

import { Fragment, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Inbox } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge, toneForStatus } from '@/components/ui/badge';
import type { Incident } from '@/types/accident-tracker';
import { formatDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';

/** One row per incident; expanding a row shows the investigation detail. */
export function IncidentRegister({ incidents, className }: { incidents: Incident[]; className?: string }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!incidents.length) {
    return (
      <Card className={cn('flex flex-col items-center justify-center gap-2 py-12 text-center', className)}>
        <Inbox className="size-7 text-muted" aria-hidden />
        <p className="text-sm font-medium text-ink">No incidents recorded</p>
        <p className="max-w-sm text-xs text-ink-2">
          Rows added to the Accident Tracker sheet appear here within about 30 seconds.
        </p>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader
        title={`${incidents.length} incident${incidents.length === 1 ? '' : 's'}`}
        subtitle="Select a row for root cause, corrective action and closure detail"
      />
      <div className="mt-4 overflow-x-auto border-t border-line">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-surface-2/70 text-xs text-ink-2">
            <tr>
              {['Date', 'Type', 'Department', 'Worker type', 'Outcome', 'Man-days', 'Status', ''].map((h) => (
                <th key={h} scope="col" className={cn('px-4 py-2.5 text-left font-medium', h === 'Man-days' && 'text-right')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {incidents.map((incident) => {
              const open = openId === incident.id;
              return (
                <Fragment key={incident.id}>
                  <tr
                    onClick={() => setOpenId(open ? null : incident.id)}
                    className="cursor-pointer transition-colors hover:bg-surface-2/50"
                  >
                    <td className="tabular px-4 py-2.5 text-ink">{formatDate(incident.date)}</td>
                    <td className="px-4 py-2.5 text-ink">{incident.accidentType ?? '—'}</td>
                    <td className="px-4 py-2.5 text-ink-2">{incident.department ?? '—'}</td>
                    <td className="px-4 py-2.5 text-ink-2">
                      {incident.employmentType ?? '—'}
                      {incident.contractor ? ` · ${incident.contractor}` : ''}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {incident.fatality && <Badge tone="critical">Fatal</Badge>}
                        {incident.lti && <Badge tone="warning">LTI</Badge>}
                        {incident.hospitalization && <Badge tone="warning">Hospitalised</Badge>}
                        {incident.firstAid && <Badge tone="neutral">First aid</Badge>}
                        {incident.nearMiss && <Badge tone="neutral">Near miss</Badge>}
                      </div>
                    </td>
                    <td className="tabular px-4 py-2.5 text-right text-ink">{formatNumber(incident.manDaysLost)}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={toneForStatus(incident.status)}>{incident.status ?? 'Open'}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
                    </td>
                  </tr>
                  <AnimatePresence>
                    {open && (
                      <tr>
                        <td colSpan={8} className="bg-surface-2/40 p-0">
                          <motion.dl
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="grid gap-x-8 gap-y-3 overflow-hidden px-4 py-4 text-xs sm:grid-cols-2 lg:grid-cols-4"
                          >
                            {[
                              ['Injury type', incident.injuryType],
                              ['Designation', incident.designation],
                              ['Section', incident.section],
                              ['Man-hours worked (month)', formatNumber(incident.manHoursWorked)],
                              ['Root cause', incident.rootCause],
                              ['Corrective action', incident.correctiveAction],
                              ['Responsible', incident.responsiblePerson],
                              ['Target date', formatDate(incident.targetDate)],
                              ['Closure date', formatDate(incident.closureDate)],
                              ['Remarks', incident.remarks],
                            ].map(([label, value]) => (
                              <div key={label as string}>
                                <dt className="text-muted">{label as string}</dt>
                                <dd className="mt-0.5 text-ink">{(value as string) || '—'}</dd>
                              </div>
                            ))}
                          </motion.dl>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
