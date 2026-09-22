'use client';

import { motion } from 'motion/react';
import {
  Activity,
  ClipboardCheck,
  GraduationCap,
  HardHat,
  MessageSquareWarning,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';
import type { MonthKey, Overview, Period } from '@/types/officer-return';
import { Card, CardHeader, SectionHeading, stagger } from '@/components/ui/card';
import { StatTile } from '@/components/ui/stat-tile';
import { MeterRow, toneForRate } from '@/components/ui/meter';
import { ChartCard } from '@/components/charts/chart-card';
import { BarChart } from '@/components/charts/bar-chart';
import { MonthColumns } from '@/components/charts/month-columns';
import { DonutChart } from '@/components/charts/donut-chart';
import { useChartPalette } from '@/components/charts/use-chart-palette';
import { formatNumber, formatPercent } from '@/lib/format';
import { DataChecksPanel } from '../shared/data-checks-panel';
import { AiInsightsCard } from '../shared/ai-insights-card';
import { SubmissionProgress } from './submission-progress';
import { KpiMatrix } from './kpi-matrix';

export function AnnualView({ overview, onSelectMonth }: { overview: Overview; onSelectMonth: (p: Period) => void }) {
  const palette = useChartPalette();
  const { ytd, snapshot, breakdowns, trend } = overview;
  const asOf = snapshot ? `as of ${snapshot.label}` : 'no returns yet';
  const submittedMonths = overview.months.filter((m) => m.hasData).map((m) => m.short).join(', ');
  const ytdLabel = overview.submittedCount
    ? `FY ${overview.fy} to date · ${overview.submittedCount} month${overview.submittedCount === 1 ? '' : 's'} (${submittedMonths})`
    : `FY ${overview.fy}`;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-12 xl:grid-cols-4">
        <StatTile
          label="Workforce"
          icon={Users}
          value={snapshot?.headcountClosing}
          detail={snapshot ? `${asOf} · ${snapshot.maleWorkers} male · ${snapshot.femaleWorkers} female` : asOf}
        />
        <StatTile
          label="Grievances received"
          icon={MessageSquareWarning}
          value={ytd.grievancesReceived}
          meter={{ value: ytd.grievanceResolutionRate, tone: toneForRate(ytd.grievanceResolutionRate) === 'good' ? 'good' : 'warning' }}
          detail={`${formatPercent(ytd.grievanceResolutionRate)} resolved · ${formatNumber(snapshot?.grievancesPending ?? 0)} pending`}
        />
        <StatTile
          label="Safety incidents"
          icon={HardHat}
          value={ytd.safetyIncidents}
          detail={`${formatNumber(ytd.reportableAccidents)} accidents · ${formatNumber(ytd.nearMisses)} near miss · ${formatNumber(ytd.manDaysLost)} man-days lost`}
        />
        <StatTile
          label="Medical cases"
          icon={Stethoscope}
          value={ytd.medicalCases}
          detail="Attended, first-aid, hospitalisation & exams"
        />
        <StatTile
          label="Welfare activities"
          icon={Activity}
          value={ytd.welfareActivities}
          detail={`${formatNumber(ytd.activityParticipants)} participants · ${formatNumber(ytd.inspections)} inspections`}
        />
        <StatTile
          label="Training participants"
          icon={GraduationCap}
          value={ytd.trainingParticipants}
          detail={`${formatNumber(ytd.trainingSessions)} programmes delivered`}
        />
        <StatTile
          label="Statutory compliance"
          icon={ShieldCheck}
          value={snapshot?.statutoryComplianceRate}
          format={(n) => `${Math.round(n)}%`}
          meter={{ value: snapshot?.statutoryComplianceRate ?? null, tone: 'good' }}
          detail={asOf}
        />
        <StatTile
          label="Contract labour"
          icon={ClipboardCheck}
          value={snapshot?.contractorManpower}
          detail={`${formatPercent(snapshot?.contractorComplianceRate)} contractor compliance · ${asOf}`}
        />
      </div>

      {overview.submittedCount > 0 && <AiInsightsCard period="annual" className="lg:col-span-12" />}

      <SubmissionProgress months={overview.months} onSelect={onSelectMonth} className="lg:col-span-12" />

      <SectionHeading title="Monthly trends" description="April → March. Months without a submitted return are left blank, not zero." />

      <ChartCard
        className="lg:col-span-8"
        title="Welfare workload by month"
        subtitle="Count of cases and activities recorded in each monthly return"
        legend={[
          { label: 'Medical cases', color: palette.series[0] },
          { label: 'Welfare activities', color: palette.series[1] },
          { label: 'Grievances', color: palette.series[2] },
          { label: 'Safety incidents', color: palette.series[3] },
        ]}
        table={{
          columns: [
            { key: 'label', label: 'Month' },
            { key: 'medicalCases', label: 'Medical', numeric: true, format: fmt },
            { key: 'welfareActivities', label: 'Activities', numeric: true, format: fmt },
            { key: 'grievancesReceived', label: 'Grievances', numeric: true, format: fmt },
            { key: 'safetyIncidents', label: 'Incidents', numeric: true, format: fmt },
          ],
          rows: trend,
        }}
      >
        <MonthColumns
          data={trend}
          ariaLabel="Monthly counts of medical cases, welfare activities, grievances and safety incidents"
          series={[
            { key: 'medicalCases', label: 'Medical cases', slot: 0 },
            { key: 'welfareActivities', label: 'Welfare activities', slot: 1 },
            { key: 'grievancesReceived', label: 'Grievances', slot: 2 },
            { key: 'safetyIncidents', label: 'Safety incidents', slot: 3 },
          ]}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-4"
        title="Workforce composition"
        subtitle={`Closing headcount by employment type, ${asOf}`}
        table={{
          columns: [
            { key: 'label', label: 'Category' },
            { key: 'closing', label: 'Closing', numeric: true, format: fmt },
          ],
          rows: breakdowns.manpowerByType,
        }}
      >
        <DonutChart
          ariaLabel="Workforce by employment type"
          centerLabel="workers"
          slices={breakdowns.manpowerByType.map((row, i) => ({ label: row.label, value: Number(row.closing), slot: i }))}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-6"
        title="Headcount by month"
        subtitle="Closing headcount split by gender"
        legend={[
          { label: 'Male', color: palette.series[0] },
          { label: 'Female', color: palette.series[1] },
        ]}
        table={{
          columns: [
            { key: 'label', label: 'Month' },
            { key: 'maleWorkers', label: 'Male', numeric: true, format: fmt },
            { key: 'femaleWorkers', label: 'Female', numeric: true, format: fmt },
            { key: 'headcountClosing', label: 'Total', numeric: true, format: fmt },
            { key: 'attritionRate', label: 'Attrition', numeric: true, format: (v) => formatPercent(v as number | null, 1) },
          ],
          rows: trend,
        }}
      >
        <MonthColumns
          data={trend}
          stacked
          height={260}
          ariaLabel="Closing headcount by month, male and female"
          series={[
            { key: 'maleWorkers', label: 'Male', slot: 0 },
            { key: 'femaleWorkers', label: 'Female', slot: 1 },
          ]}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-6"
        title="Joinings vs separations"
        subtitle="Workforce movement across all employment types"
        legend={[
          { label: 'Joinings', color: palette.series[0] },
          { label: 'Separations', color: palette.series[1] },
        ]}
        table={{
          columns: [
            { key: 'label', label: 'Month' },
            { key: 'joinings', label: 'Joinings', numeric: true, format: fmt },
            { key: 'separations', label: 'Separations', numeric: true, format: fmt },
          ],
          rows: trend,
        }}
      >
        <MonthColumns
          data={trend}
          height={260}
          ariaLabel="Joinings and separations by month"
          series={[
            { key: 'joinings', label: 'Joinings', slot: 0 },
            { key: 'separations', label: 'Separations', slot: 1 },
          ]}
        />
      </ChartCard>

      <SectionHeading title="Year-to-date breakdown" description={ytdLabel} />

      <ChartCard
        className="lg:col-span-6"
        title="Grievances by category"
        subtitle="Received = resolved + pending"
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
          rows: breakdowns.grievancesByCategory,
        }}
      >
        <BarChart
          ariaLabel="Grievances by category, resolved and pending"
          data={breakdowns.grievancesByCategory}
          stacked
          series={[
            { key: 'resolved', label: 'Resolved', slot: 0 },
            { key: 'pending', label: 'Pending', slot: 1 },
          ]}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-6"
        title="Safety incidents by type"
        subtitle={`${formatNumber(ytd.manDaysLost)} man-days lost in total`}
        icon={HardHat}
        table={{
          columns: [
            { key: 'label', label: 'Type' },
            { key: 'cases', label: 'Cases', numeric: true, format: fmt },
            { key: 'manDaysLost', label: 'Man-days lost', numeric: true, format: fmt },
          ],
          rows: breakdowns.accidentsByType,
        }}
      >
        <BarChart
          ariaLabel="Safety incidents by type"
          data={breakdowns.accidentsByType}
          series={[{ key: 'cases', label: 'Cases', slot: 0 }]}
          tooltipExtra={(row) => `${formatNumber(Number(row.manDaysLost))} man-days lost`}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-4"
        title="Health & medical"
        subtitle="Cases by type"
        icon={Stethoscope}
        table={{
          columns: [
            { key: 'label', label: 'Particular' },
            { key: 'count', label: 'Count', numeric: true, format: fmt },
          ],
          rows: breakdowns.healthByParticular,
        }}
      >
        <BarChart
          ariaLabel="Health and medical cases by type"
          data={breakdowns.healthByParticular}
          categoryWidth={140}
          series={[{ key: 'count', label: 'Cases', slot: 0 }]}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-4"
        title="Training reach"
        subtitle="Participants per programme"
        icon={GraduationCap}
        table={{
          columns: [
            { key: 'label', label: 'Programme' },
            { key: 'participants', label: 'Participants', numeric: true, format: fmt },
          ],
          rows: breakdowns.trainingByProgramme,
        }}
      >
        <BarChart
          ariaLabel="Training participants per programme"
          data={breakdowns.trainingByProgramme}
          categoryWidth={130}
          series={[{ key: 'participants', label: 'Participants', slot: 0 }]}
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-4"
        title="Welfare officer activities"
        subtitle="Participants reached per activity"
        icon={Activity}
        table={{
          columns: [
            { key: 'label', label: 'Activity' },
            { key: 'conducted', label: 'Conducted', numeric: true, format: fmt },
            { key: 'participants', label: 'Participants', numeric: true, format: fmt },
          ],
          rows: breakdowns.activitiesByType,
        }}
      >
        <BarChart
          ariaLabel="Participants reached per welfare activity"
          data={breakdowns.activitiesByType}
          categoryWidth={140}
          series={[{ key: 'participants', label: 'Participants', slot: 0 }]}
          tooltipExtra={(row) => `${formatNumber(Number(row.conducted))} session(s) conducted`}
        />
      </ChartCard>

      <Card className="lg:col-span-4">
        <CardHeader title="Compliance health" subtitle={`Latest return, ${asOf}`} icon={ShieldCheck} />
        <div className="space-y-5 p-5">
          <MeterRow label="Statutory compliance" rate={snapshot?.statutoryComplianceRate ?? null} />
          <MeterRow label="Contractor labour compliance" rate={snapshot?.contractorComplianceRate ?? null} />
          <MeterRow
            label="Grievance resolution (YTD)"
            rate={ytd.grievanceResolutionRate}
            detail={`${formatNumber(ytd.grievancesResolved)} of ${formatNumber(ytd.grievancesReceived)} resolved`}
          />
        </div>
      </Card>

      <DataChecksPanel checks={overview.checks} className="lg:col-span-8" />

      <KpiMatrix overview={overview} onSelectMonth={(m: MonthKey) => onSelectMonth(m)} className="lg:col-span-12" />

      {overview.observations && (
        <Card className="lg:col-span-12">
          <CardHeader title="Annual management observations" />
          <p className="whitespace-pre-line p-5 text-sm text-ink-2">{overview.observations}</p>
        </Card>
      )}
    </motion.div>
  );
}

const fmt = (v: unknown) => formatNumber(v as number | null);
