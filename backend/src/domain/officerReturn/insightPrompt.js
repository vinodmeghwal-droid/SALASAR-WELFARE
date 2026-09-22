/**
 * Builds what Gemini sees for an insights request. Pure functions.
 * Only aggregated, operational figures are sent — no personal names or addresses.
 */

export const INSIGHT_SYSTEM = `You are an HR welfare and labour-compliance analyst for a manufacturing plant in India
(Factories Act 1948, Contract Labour Act, ESIC/PF context). You review a Welfare Officer's monthly return data.

Rules:
- Use ONLY the data provided. Every number you cite must appear in the data (or be a simple ratio of two numbers in it).
- If only one month is submitted, do not claim trends; say more months are needed for trend analysis.
- Treat items in "dataChecks" as data-quality caveats; mention the important ones under risks.
- Be specific and practical: name the category, the figure, and the action. No generic HR advice.
- Keep each text field short (one or two sentences). Use Indian English.`;

/** Gemini responseSchema (OpenAPI subset). */
export const INSIGHT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    headline: { type: 'STRING', description: 'One-sentence overall verdict, max 20 words' },
    summary: { type: 'STRING', description: '2-3 sentence executive summary' },
    healthScore: {
      type: 'INTEGER',
      description: '0-100 overall welfare & compliance health judged from the data (100 = excellent)',
    },
    keyMetrics: {
      type: 'ARRAY',
      description: '3-4 figures management should look at first',
      items: {
        type: 'OBJECT',
        properties: {
          label: { type: 'STRING' },
          value: { type: 'STRING', description: 'The figure exactly as in the data, with unit, e.g. "4.1%" or "7 of 7"' },
          note: { type: 'STRING', description: 'Why it matters, max 12 words' },
        },
        required: ['label', 'value', 'note'],
      },
    },
    highlights: {
      type: 'ARRAY',
      description: '2-4 things going well',
      items: {
        type: 'OBJECT',
        properties: { title: { type: 'STRING' }, detail: { type: 'STRING' } },
        required: ['title', 'detail'],
      },
    },
    risks: {
      type: 'ARRAY',
      description: '2-4 concerns or data-quality issues, most severe first',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          detail: { type: 'STRING' },
          severity: { type: 'STRING', enum: ['high', 'medium', 'low'] },
        },
        required: ['title', 'detail', 'severity'],
      },
    },
    recommendations: {
      type: 'ARRAY',
      description: '3-5 concrete next actions for the welfare officer / HR',
      items: {
        type: 'OBJECT',
        properties: {
          action: { type: 'STRING' },
          rationale: { type: 'STRING' },
          priority: { type: 'STRING', enum: ['high', 'medium', 'low'] },
        },
        required: ['action', 'rationale', 'priority'],
      },
    },
  },
  required: ['headline', 'summary', 'healthScore', 'keyMetrics', 'highlights', 'risks', 'recommendations'],
};

const pickRows = (section, fields) =>
  (section?.rows ?? []).map((row) => Object.fromEntries([['label', row.label], ...fields.map((f) => [f, row[f]])]));

/** Annual (year-to-date) context from the overview payload. */
export function buildAnnualContext(overview) {
  return {
    scope: `Financial year ${overview.fy}, year to date`,
    submittedMonths: overview.months.filter((m) => m.hasData).map((m) => m.label),
    pendingMonths: overview.months.filter((m) => !m.hasData).map((m) => m.label),
    latestSnapshot: overview.snapshot,
    yearToDate: overview.ytd,
    monthlyTrend: overview.trend.filter((p) => p.hasData),
    breakdowns: overview.breakdowns,
    dataChecks: overview.checks.map((c) => `${c.title} — ${c.detail}`),
  };
}

/** Single-month context from a MonthlyReturn record. */
export function buildMonthContext(record) {
  const s = record.sections;
  return {
    scope: `Monthly return for ${record.label} (${record.header?.reportingPeriod ?? record.fy})`,
    kpis: record.kpis,
    declaredTotalWorkers: record.header?.declaredTotalWorkers ?? null,
    manpower: pickRows(s.manpower, ['group', 'opening', 'joining', 'separation', 'closing']),
    facilities: pickRows(s.facilities, ['available', 'condition', 'observation', 'actionRequired']),
    health: pickRows(s.health, ['count', 'remarks']),
    accidents: pickRows(s.accidents, ['cases', 'manDaysLost']),
    accidentNotes: s.accidents?.notes ?? [],
    grievances: pickRows(s.grievances, ['received', 'resolved', 'pending']),
    activities: pickRows(s.activities, ['conducted', 'participants', 'observations', 'actionTaken']),
    contractors: (s.contractors?.rows ?? []).map((r) => ({
      manpower: r.manpower,
      attendance: r.attendance,
      wagePayment: r.wagePayment,
      pf: r.pf,
      esic: r.esic,
      lwfPt: r.lwfPt,
    })),
    training: pickRows(s.training, ['date', 'participants']),
    statutoryCompliance: pickRows(s.compliance, ['status', 'observation']),
    officerRemarks: record.remarks,
    dataChecks: record.checks.map((c) => `${c.title} — ${c.detail}`),
  };
}

export function buildInsightPrompt(context) {
  return `Analyse this Welfare Officer Return data and respond in the required JSON format.\n\nDATA:\n${JSON.stringify(context)}`;
}
