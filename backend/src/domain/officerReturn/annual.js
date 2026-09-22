import { FY_MONTHS } from '../../parsers/officerReturn/schema.js';

const FLOW_KPIS = [
  'joinings',
  'separations',
  'medicalCases',
  'safetyIncidents',
  'reportableAccidents',
  'nearMisses',
  'manDaysLost',
  'grievancesReceived',
  'grievancesResolved',
  'welfareActivities',
  'activityParticipants',
  'inspections',
  'trainingSessions',
  'trainingParticipants',
];

/** Trend fields sent per month (null for months not yet submitted so charts show gaps, not zeros). */
const TREND_KPIS = [
  'headcountClosing',
  'maleWorkers',
  'femaleWorkers',
  'attritionRate',
  'grievancesPending',
  'statutoryComplianceRate',
  'contractorComplianceRate',
  ...FLOW_KPIS,
];

/**
 * Fiscal-year rollup across month records (already sorted Apr → Mar).
 * Flow metrics are summed; stock metrics (headcount, rates) use the latest submitted month.
 */
export function buildAnnualOverview(monthRecords) {
  const byKey = Object.fromEntries(monthRecords.map((m) => [m.month, m]));
  const submitted = FY_MONTHS.map((m) => byKey[m.key]).filter((m) => m?.hasData);
  const latest = submitted.at(-1) ?? null;

  const ytd = Object.fromEntries(FLOW_KPIS.map((k) => [k, submitted.reduce((s, m) => s + (m.kpis[k] ?? 0), 0)]));
  ytd.grievanceResolutionRate = ytd.grievancesReceived
    ? Math.round((ytd.grievancesResolved / ytd.grievancesReceived) * 1000) / 10
    : null;

  const months = FY_MONTHS.map((meta) => {
    const record = byKey[meta.key];
    return {
      key: meta.key,
      label: meta.label,
      short: meta.short,
      hasData: Boolean(record?.hasData),
      checkCount: record?.checks?.length ?? 0,
    };
  });

  const trend = FY_MONTHS.map((meta) => {
    const record = byKey[meta.key];
    const point = { month: meta.key, label: meta.short, hasData: Boolean(record?.hasData) };
    for (const k of TREND_KPIS) point[k] = record?.hasData ? (record.kpis[k] ?? null) : null;
    return point;
  });

  return {
    months,
    submittedCount: submitted.length,
    latestMonth: latest?.month ?? null,
    snapshot: latest
      ? {
          month: latest.month,
          label: latest.label,
          headcountClosing: latest.kpis.headcountClosing,
          maleWorkers: latest.kpis.maleWorkers,
          femaleWorkers: latest.kpis.femaleWorkers,
          attritionRate: latest.kpis.attritionRate,
          grievancesPending: latest.kpis.grievancesPending,
          statutoryComplianceRate: latest.kpis.statutoryComplianceRate,
          contractorComplianceRate: latest.kpis.contractorComplianceRate,
          contractorManpower: latest.kpis.contractorManpower,
        }
      : null,
    ytd,
    trend,
    breakdowns: {
      manpowerByType: latest ? pick(latest.sections.manpower?.rows.filter((r) => r.group === 'type'), ['closing']) : [],
      grievancesByCategory: aggregate(submitted, 'grievances', ['received', 'resolved', 'pending']),
      accidentsByType: aggregate(submitted, 'accidents', ['cases', 'manDaysLost']),
      healthByParticular: aggregate(submitted, 'health', ['count']),
      activitiesByType: aggregate(submitted, 'activities', ['conducted', 'participants']),
      trainingByProgramme: aggregate(submitted, 'training', ['participants']),
    },
  };
}

/** Sum numeric fields per row label across months, preserving first-seen row order. */
function aggregate(records, sectionId, fields) {
  const rows = new Map();
  for (const record of records) {
    for (const row of record.sections[sectionId]?.rows ?? []) {
      const acc = rows.get(row.id) ?? { id: row.id, label: row.label, ...Object.fromEntries(fields.map((f) => [f, 0])) };
      for (const f of fields) acc[f] += row[f] ?? 0;
      rows.set(row.id, acc);
    }
  }
  return [...rows.values()];
}

function pick(rows = [], fields) {
  return rows.map((row) => ({ id: row.id, label: row.label, ...Object.fromEntries(fields.map((f) => [f, row[f] ?? 0])) }));
}
