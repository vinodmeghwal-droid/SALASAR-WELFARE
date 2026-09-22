'use client';

import { motion } from 'motion/react';
import { Activity, CalendarDays, GraduationCap, HardHat, MessageSquareWarning, Stethoscope, Users } from 'lucide-react';
import type { MonthKey, Overview } from '@/types/officer-return';
import { useMonthReturn } from '@/hooks/use-officer-return';
import { sheetTabUrl } from '@/config/sheet-links';
import { SectionHeading, stagger } from '@/components/ui/card';
import { StatTile } from '@/components/ui/stat-tile';
import { toneForRate } from '@/components/ui/meter';
import { DashboardSkeleton, EmptyState, ErrorState } from '@/components/ui/states';
import { formatNumber, formatPercent } from '@/lib/format';
import { DataChecksPanel } from '../shared/data-checks-panel';
import { MONTH_LABELS } from '../periods';
import { ReturnDetailsCard } from './return-details-card';
import { WorkforceSection } from './sections/workforce-section';
import { FacilitiesSection } from './sections/facilities-section';
import { HealthSafetySection } from './sections/health-safety-section';
import { EmployeeRelationsSection } from './sections/employee-relations-section';
import { TrainingSection } from './sections/training-section';
import { ComplianceSection } from './sections/compliance-section';

export function MonthView({ month, overview }: { month: MonthKey; overview: Overview }) {
  const { data, error, isLoading, mutate } = useMonthReturn(month);
  const label = MONTH_LABELS[month].long;

  if (error && !data) return <ErrorState message={error.message} onRetry={() => mutate()} />;
  if (isLoading || !data || data.month !== month) return <DashboardSkeleton />;

  if (!data.hasData) {
    const tabUrl = sheetTabUrl(overview.source.fileId, month, overview.source.webViewLink);
    return (
      <EmptyState
        icon={CalendarDays}
        title={`${label} return not submitted yet`}
        description={
          <>
            The {MONTH_LABELS[month].short} tab in the workbook is still the blank template. Charts for {label} appear here
            automatically, within about 30 seconds of the welfare officer filling it in on Google Drive.
          </>
        }
        action={tabUrl ? { href: tabUrl, label: `Open ${MONTH_LABELS[month].short} tab` } : null}
      />
    );
  }

  const k = data.kpis;
  const netChange = k.headcountClosing - k.headcountOpening;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <ReturnDetailsCard data={data} className="lg:col-span-12" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-12 xl:grid-cols-6">
        <StatTile
          label="Closing headcount"
          icon={Users}
          value={k.headcountClosing}
          detail={`${netChange >= 0 ? '+' : ''}${netChange} vs opening ${formatNumber(k.headcountOpening)}`}
        />
        <StatTile
          label="Attrition rate"
          icon={Users}
          value={k.attritionRate}
          format={(n) => `${n.toFixed(1)}%`}
          detail={`${k.joinings} joined · ${k.separations} separated`}
        />
        <StatTile
          label="Grievances"
          icon={MessageSquareWarning}
          value={k.grievancesReceived}
          meter={{ value: k.grievanceResolutionRate, tone: toneForRate(k.grievanceResolutionRate) === 'good' ? 'good' : 'warning' }}
          detail={`${formatPercent(k.grievanceResolutionRate)} resolved · ${k.grievancesPending} pending`}
        />
        <StatTile
          label="Safety incidents"
          icon={HardHat}
          value={k.safetyIncidents}
          detail={`${k.manDaysLost} man-days lost`}
        />
        <StatTile label="Medical cases" icon={Stethoscope} value={k.medicalCases} detail="All health & medical entries" />
        <StatTile
          label="Training reach"
          icon={GraduationCap}
          value={k.trainingParticipants}
          detail={`${k.trainingSessions} programmes`}
        />
      </div>

      {data.checks.length > 0 && <DataChecksPanel checks={data.checks} className="lg:col-span-12" />}

      <SectionHeading letter="A" title="Manpower statement" description="Opening, joining, separation and closing by category" />
      <WorkforceSection data={data} />

      <SectionHeading letter="B" title="Welfare facilities" description={`${k.facilitiesAvailable} of ${k.facilitiesTotal} available · ${k.facilitiesSatisfactory} in satisfactory condition`} />
      <FacilitiesSection data={data} />

      <SectionHeading letter="C–D" title="Health, medical & safety" />
      <HealthSafetySection data={data} />

      <SectionHeading letter="E–F" title="Employee relations & welfare activities" />
      <EmployeeRelationsSection data={data} />

      <SectionHeading letter="G, I" title="Compliance" description="Contractor labour and statutory compliance" />
      <ComplianceSection data={data} />

      <SectionHeading letter="H" title="Training & awareness" />
      <TrainingSection data={data} />

      {data.remarks && (
        <motion.blockquote className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-2 shadow-card lg:col-span-12">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Welfare officer remarks</p>
          <p className="whitespace-pre-line">{data.remarks}</p>
        </motion.blockquote>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted lg:col-span-12">
        <Activity className="size-3.5" aria-hidden />
        Source: “{data.sheetName}” tab · last synced {new Date(data.updatedAt).toLocaleString('en-GB')}
      </p>
    </motion.div>
  );
}
