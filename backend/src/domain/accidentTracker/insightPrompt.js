/** Context sent to Gemini for the Accident Tracker. Aggregates only — no employee names. */

export const ACCIDENT_INSIGHT_SYSTEM = `You are a factory safety (HSE) analyst for a manufacturing plant in India
(Factories Act 1948, LTI/LTIFR conventions). You review a Safety Accident & LTI tracker.

Rules:
- Use ONLY the data provided. Every number you cite must appear in the data (or be a simple ratio of two numbers in it).
- LTIFR = LTI x 1,000,000 / man-hours worked; Severity Rate = man-days lost x 1,000,000 / man-hours.
- With very few incidents, say the rates are volatile and based on a small sample; do not over-generalise.
- Treat "dataChecks" as data-quality caveats and surface the important ones under risks.
- Focus on prevention: root causes, corrective-action closure, repeat departments or contractors.
- Never name individuals. Keep each text field to one or two sentences. Use Indian English.`;

export function buildAccidentContext(overview, monthId) {
  const month = monthId ? overview.months.find((m) => m.monthId === monthId) : null;
  const scope = month
    ? `Accident tracker for ${month.label}`
    : `Accident tracker, financial year ${overview.fy} (${overview.reportingPeriod ?? 'full year'})`;

  return {
    scope,
    totals: month ? month.kpis : overview.totals,
    monthsWithIncidents: overview.months.filter((m) => m.hasData).map((m) => m.label),
    monthlyTrend: overview.months.filter((m) => m.hasData).map((m) => ({ month: m.label, ...m.kpis })),
    correctiveActions: overview.capa,
    breakdowns: overview.breakdowns,
    dataChecks: overview.checks.map((c) => `${c.title} — ${c.detail}`),
  };
}
