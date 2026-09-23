'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  BadgeCheck,
  Building2,
  CircleCheck,
  ClipboardCheck,
  Clock,
  HardHat,
  HeartPulse,
  Skull,
  TriangleAlert,
} from 'lucide-react';
import { useIncidents } from '@/hooks/use-officer-return';
import type { AccidentOverview, BreakdownEntry, Incident } from '@/types/accident-tracker';
import { Card, CardHeader, SectionHeading, stagger } from '@/components/ui/card';
import { StatTile } from '@/components/ui/stat-tile';
import { MeterRow } from '@/components/ui/meter';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/states';
import { ChartCard } from '@/components/charts/chart-card';
import { BarChart } from '@/components/charts/bar-chart';
import { MonthColumns } from '@/components/charts/month-columns';
import { DonutChart } from '@/components/charts/donut-chart';
import { useChartPalette } from '@/components/charts/use-chart-palette';
import { formatNumber, formatPercent } from '@/lib/format';
import { DataChecksPanel } from '@/features/officer-return/shared/data-checks-panel';
import { AiInsightsCard } from '@/features/officer-return/shared/ai-insights-card';
import { IncidentRegister } from './incident-register';

const fmt = (v: unknown) => formatNumber(v as number);

export function AccidentView({ overview, period }: { overview: AccidentOverview; period: string }) {
  const palette = useChartPalette();
  const isAnnual = period === 'annual';
  const month = overview.months.find((m) => m.monthId === period);
  const kpis = isAnnual ? overview.totals : (month?.kpis ?? overview.totals);
  const scope = isAnnual ? `FY ${overview.fy}` : (month?.label ?? period);

  const { data: incidentData, isLoading: incidentsLoading } = useIncidents(isAnnual ? undefined : period);
  const incidents = incidentData?.incidents ?? [];

  // Annual breakdowns come precomputed; a month view re-groups its own incidents.
  const breakdowns = useMemo(
    () =>
      isAnnual
        ? overview.breakdowns
        : {
            byAccidentType: groupIncidents(incidents, 'accidentType'),
            byInjuryType: groupIncidents(incidents, 'injuryType'),
            byDepartment: groupIncidents(incidents, 'department'),
            byEmploymentType: groupIncidents(incidents, 'employmentType'),
            byContractor: groupIncidents(incidents, 'contractor'),
            byRootCause: groupIncidents(incidents, 'rootCause'),
            byStatus: groupIncidents(incidents, 'status'),
          },
    [isAnnual, overview.breakdowns, incidents],
  );

  const checks = isAnnual ? overview.checks : overview.checks.filter((c) => !c.month || c.month === period);
  const trend = overview.months.map((m) => ({
    month: m.monthId,
    label: m.label.replace(/ 20(\d\d)$/, " '$1"),
    hasData: m.hasData,
    ...m.kpis,
  }));

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Headline safety KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-12 xl:grid-cols-4">
        <StatTile
          label="Accidents"
          icon={HardHat}
          value={kpis.accidents}
          detail={`${kpis.majorAccidents} major · ${kpis.minorAccidents} minor · ${scope}`}
        />
        <StatTile
          label="Lost Time Injuries"
          icon={TriangleAlert}
          value={kpis.lti}
          detail={`${formatPercent(kpis.ltiPercentOfAccidents)} of accidents · ${kpis.manDaysLost} man-days lost`}
        />
        <StatTile
          label="Fatalities"
          icon={Skull}
          value={kpis.fatalities}
          detail={kpis.fatalities === 0 ? 'None recorded — keep it there' : 'Immediate investigation required'}
        />
        <StatTile
          label="LTIFR"
          icon={Activity}
          value={kpis.ltifr}
          format={(n) => formatNumber(Math.round(n))}
          detail={`per million man-hours · ${formatNumber(kpis.manHoursWorked)} hours worked`}
        />
        <StatTile
          label="Severity rate"
          icon={Clock}
          value={kpis.severityRate}
          format={(n) => formatNumber(Math.round(n))}
          detail="man-days lost per million man-hours"
        />
        <StatTile
          label="Near misses"
          icon={HeartPulse}
          value={kpis.nearMisses}
          detail={kpis.nearMissRatio !== null ? `${kpis.nearMissRatio} per accident reported` : 'None reported'}
        />
        <StatTile label="First aid cases" icon={BadgeCheck} value={kpis.firstAid} detail={`${kpis.hospitalisations} hospitalisation(s)`} />
        <StatTile
          label="Actions closed"
          icon={ClipboardCheck}
          value={overview.capa.closureRate}
          format={(n) => `${Math.round(n)}%`}
          meter={{ value: overview.capa.closureRate, tone: overview.capa.overdue > 0 ? 'warning' : 'good' }}
          detail={`${overview.capa.open} open · ${overview.capa.overdue} overdue (full year)`}
        />
      </div>

      {isAnnual && (
        <>
          <SectionHeading title="Safety trend" description="May → April. Months with no incidents recorded are left blank." />

          <ChartCard
            className="lg:col-span-7"
            title="Incidents by month"
            subtitle="Recorded events split by outcome"
            icon={HardHat}
            legend={[
              { label: 'Accidents', color: palette.series[0] },
              { label: 'LTI', color: palette.series[1] },
              { label: 'Near miss', color: palette.series[2] },
              { label: 'First aid', color: palette.series[3] },
            ]}
            table={{
              columns: [
                { key: 'label', label: 'Month' },
                { key: 'accidents', label: 'Accidents', numeric: true, format: fmt },
                { key: 'lti', label: 'LTI', numeric: true, format: fmt },
                { key: 'nearMisses', label: 'Near miss', numeric: true, format: fmt },
                { key: 'firstAid', label: 'First aid', numeric: true, format: fmt },
              ],
              rows: trend,
            }}
          >
            <MonthColumns
              data={trend}
              ariaLabel="Accidents, LTI, near misses and first aid cases by month"
              series={[
                { key: 'accidents', label: 'Accidents', slot: 0 },
                { key: 'lti', label: 'LTI', slot: 1 },
                { key: 'nearMisses', label: 'Near miss', slot: 2 },
                { key: 'firstAid', label: 'First aid', slot: 3 },
              ]}
            />
          </ChartCard>

          <ChartCard
            className="lg:col-span-5"
            title="LTIFR by month"
            subtitle="Lost Time Injury Frequency Rate per million man-hours"
            icon={Activity}
            table={{
              columns: [
                { key: 'label', label: 'Month' },
                { key: 'ltifr', label: 'LTIFR', numeric: true, format: fmt },
                { key: 'manHoursWorked', label: 'Man-hours', numeric: true, format: fmt },
              ],
              rows: trend,
            }}
            footer="LTIFR = LTI × 1,000,000 ÷ man-hours worked. With few incidents the rate swings widely, so read it alongside the counts."
          >
            <MonthColumns
              data={trend}
              height={260}
              ariaLabel="LTI frequency rate by month"
              series={[{ key: 'ltifr', label: 'LTIFR', slot: 0 }]}
            />
          </ChartCard>

          <ChartCard
            className="lg:col-span-5"
            title="Man-days lost by month"
            subtitle="Working days lost to injury"
            icon={Clock}
            table={{
              columns: [
                { key: 'label', label: 'Month' },
                { key: 'manDaysLost', label: 'Man-days lost', numeric: true, format: fmt },
                { key: 'severityRate', label: 'Severity rate', numeric: true, format: fmt },
              ],
              rows: trend,
            }}
          >
            <MonthColumns
              data={trend}
              height={260}
              ariaLabel="Man-days lost by month"
              series={[{ key: 'manDaysLost', label: 'Man-days lost', slot: 0 }]}
            />
          </ChartCard>
        </>
      )}

      <SectionHeading title="Where incidents happen" description={`Breakdown of the ${scope} register`} />

      <ChartCard
        className="lg:col-span-4"
        title="By accident type"
        subtitle="Severity mix of recorded events"
        icon={HardHat}
        table={{
          columns: [
            { key: 'label', label: 'Type' },
            { key: 'count', label: 'Count', numeric: true, format: fmt },
            { key: 'lti', label: 'LTI', numeric: true, format: fmt },
          ],
          rows: breakdowns.byAccidentType,
        }}
      >
        {breakdowns.byAccidentType.length ? (
          <DonutChart
            ariaLabel="Incidents by accident type"
            centerLabel="incidents"
            slices={breakdowns.byAccidentType.slice(0, 4).map((row, i) => ({ label: row.label, value: row.count, slot: i }))}
          />
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard
        className="lg:col-span-4"
        title="By department"
        subtitle="Incident count, with LTI in the tooltip"
        icon={Building2}
        table={{
          columns: [
            { key: 'label', label: 'Department' },
            { key: 'count', label: 'Incidents', numeric: true, format: fmt },
            { key: 'lti', label: 'LTI', numeric: true, format: fmt },
            { key: 'manDaysLost', label: 'Man-days', numeric: true, format: fmt },
          ],
          rows: breakdowns.byDepartment,
        }}
      >
        {breakdowns.byDepartment.length ? (
          <BarChart
            ariaLabel="Incidents by department"
            data={breakdowns.byDepartment}
            categoryWidth={130}
            series={[{ key: 'count', label: 'Incidents', slot: 0 }]}
            tooltipExtra={(row) => `${formatNumber(Number(row.lti))} LTI · ${formatNumber(Number(row.manDaysLost))} man-days lost`}
          />
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard
        className="lg:col-span-4"
        title="By employment type"
        subtitle="Permanent, contract and other workers"
        icon={ClipboardCheck}
        table={{
          columns: [
            { key: 'label', label: 'Employment type' },
            { key: 'count', label: 'Incidents', numeric: true, format: fmt },
            { key: 'lti', label: 'LTI', numeric: true, format: fmt },
          ],
          rows: breakdowns.byEmploymentType,
        }}
      >
        {breakdowns.byEmploymentType.length ? (
          <BarChart
            ariaLabel="Incidents by employment type"
            data={breakdowns.byEmploymentType}
            categoryWidth={130}
            series={[{ key: 'count', label: 'Incidents', slot: 0 }]}
          />
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard
        className="lg:col-span-6"
        title="By injury type"
        subtitle="Nature of injury recorded"
        icon={HeartPulse}
        table={{
          columns: [
            { key: 'label', label: 'Injury type' },
            { key: 'count', label: 'Count', numeric: true, format: fmt },
          ],
          rows: breakdowns.byInjuryType,
        }}
      >
        {breakdowns.byInjuryType.length ? (
          <BarChart
            ariaLabel="Incidents by injury type"
            data={breakdowns.byInjuryType}
            categoryWidth={140}
            series={[{ key: 'count', label: 'Incidents', slot: 0 }]}
          />
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <Card className="lg:col-span-6">
        <CardHeader
          title="Corrective actions (CAPA)"
          icon={ClipboardCheck}
          subtitle="Investigation and closure status across the full-year register"
        />
        <div className="space-y-5 p-5">
          <MeterRow
            label="Actions closed"
            rate={overview.capa.closureRate}
            detail={`${overview.capa.closed} of ${overview.capa.total} incidents closed${
              overview.capa.averageClosureDays !== null ? ` · ${overview.capa.averageClosureDays} days on average` : ''
            }`}
          />
          <dl className="grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
            {[
              ['Open', overview.capa.open, overview.capa.open > 0],
              ['Overdue', overview.capa.overdue, overview.capa.overdue > 0],
              ['No root cause', overview.capa.missingRootCause, overview.capa.missingRootCause > 0],
              ['No action', overview.capa.missingCorrectiveAction, overview.capa.missingCorrectiveAction > 0],
            ].map(([label, value, attention]) => (
              <div key={label as string} className="rounded-xl bg-surface-2 px-2 py-3 text-center">
                <dd className={`text-xl font-semibold ${attention ? 'text-warning-ink' : 'text-ink'}`}>
                  {formatNumber(value as number)}
                </dd>
                <dt className="text-[11px] text-muted">{label as string}</dt>
              </div>
            ))}
          </dl>
          {overview.capa.open === 0 && (
            <p className="flex items-center gap-1.5 text-xs text-good-ink">
              <CircleCheck className="size-3.5" aria-hidden />
              Every recorded incident has been closed out.
            </p>
          )}
        </div>
      </Card>

      <SectionHeading title="Incident register" description={`Every event recorded for ${scope}`} />
      {incidentsLoading && !incidentData ? (
        <Skeleton className="h-64 lg:col-span-12" />
      ) : (
        <IncidentRegister incidents={incidents} className="lg:col-span-12" />
      )}

      {checks.length > 0 && <DataChecksPanel checks={checks} className="lg:col-span-12" />}

      <AiInsightsCard dataset="accident-tracker" period={period} className="lg:col-span-12" />
    </motion.div>
  );
}

function EmptyChart() {
  return <p className="py-12 text-center text-sm text-muted">No incidents recorded for this period.</p>;
}

/** Client-side equivalent of the backend's groupBy, for single-month views. */
function groupIncidents(incidents: Incident[], field: keyof Incident): BreakdownEntry[] {
  const groups = new Map<string, BreakdownEntry>();
  for (const incident of incidents) {
    const label = String(incident[field] ?? '').trim() || 'Not specified';
    const key = label.toLowerCase();
    const entry = groups.get(key) ?? { id: key.replace(/[^a-z0-9]+/g, '-'), label, count: 0, lti: 0, manDaysLost: 0 };
    entry.count += 1;
    entry.lti += incident.lti ? 1 : 0;
    entry.manDaysLost += incident.manDaysLost ?? 0;
    groups.set(key, entry);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
