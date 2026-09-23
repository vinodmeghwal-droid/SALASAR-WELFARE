const round = (n, digits = 1) => (Number.isFinite(n) ? Math.round(n * 10 ** digits) / 10 ** digits : null);

export const isNearMiss = (i) => Boolean(i.nearMiss) || /near\s*miss/i.test(i.accidentType ?? '');
/** An injury event: everything in the register that is not purely a near miss. */
export const isAccident = (i) => !/near\s*miss/i.test(i.accidentType ?? '');

/**
 * Man-hours worked is a property of the month, entered on each incident row of that month.
 * Summing repeats it (the workbook's own SUMIF does), so take the largest distinct figure.
 */
export function monthManHours(incidents) {
  const values = [...new Set(incidents.map((i) => i.manHoursWorked ?? 0).filter((v) => v > 0))];
  return values.length ? Math.max(...values) : 0;
}

/** LTIFR / severity per 1,000,000 man-hours — the convention stated in the workbook's Instructions. */
export const ltifr = (lti, manHours) => (manHours > 0 ? round((lti * 1_000_000) / manHours) : null);
export const severityRate = (manDaysLost, manHours) => (manHours > 0 ? round((manDaysLost * 1_000_000) / manHours) : null);

export function computeKpis(incidents, manHours) {
  const count = (fn) => incidents.filter(fn).length;
  const accidents = count(isAccident);
  const lti = count((i) => i.lti);
  const manDaysLost = incidents.reduce((s, i) => s + (i.manDaysLost ?? 0), 0);

  return {
    recordedEvents: incidents.length,
    accidents,
    nearMisses: count(isNearMiss),
    lti,
    fatalities: count((i) => i.fatality),
    firstAid: count((i) => i.firstAid),
    hospitalisations: count((i) => i.hospitalization),
    majorAccidents: count((i) => /major/i.test(i.accidentType ?? '')),
    minorAccidents: count((i) => /minor/i.test(i.accidentType ?? '')),
    manDaysLost,
    lostWorkDays: incidents.reduce((s, i) => s + (i.lostWorkDays ?? 0), 0),
    manHoursWorked: manHours,
    ltifr: ltifr(lti, manHours),
    severityRate: severityRate(manDaysLost, manHours),
    ltiPercentOfAccidents: accidents > 0 ? round((lti / accidents) * 100) : null,
    nearMissRatio: accidents > 0 ? round(count(isNearMiss) / accidents, 2) : null,
  };
}

/** CAPA (corrective action) state across the register. */
export function computeCapa(incidents, today = new Date()) {
  const isClosed = (i) => /closed|complete/i.test(i.status ?? '') || Boolean(i.closureDate);
  const open = incidents.filter((i) => !isClosed(i));
  const overdue = open.filter((i) => i.targetDate && i.targetDate < toISO(today));
  const closureDays = incidents
    .filter((i) => i.closureDate && i.date && i.closureDate >= i.date)
    .map((i) => Math.round((Date.parse(i.closureDate) - Date.parse(i.date)) / 86_400_000));

  return {
    total: incidents.length,
    open: open.length,
    overdue: overdue.length,
    closed: incidents.length - open.length,
    closureRate: incidents.length ? round(((incidents.length - open.length) / incidents.length) * 100) : null,
    averageClosureDays: closureDays.length ? round(closureDays.reduce((a, b) => a + b, 0) / closureDays.length) : null,
    missingRootCause: incidents.filter((i) => !i.rootCause).length,
    missingCorrectiveAction: incidents.filter((i) => !i.correctiveAction).length,
  };
}

/** Count incidents by a text field, largest first; blanks grouped as "Not specified". */
export function groupBy(incidents, field, { extra } = {}) {
  const groups = new Map();
  for (const incident of incidents) {
    const label = (incident[field] ?? '').trim() || 'Not specified';
    const key = label.toLowerCase();
    const entry = groups.get(key) ?? { id: key.replace(/[^a-z0-9]+/g, '-'), label, count: 0, lti: 0, manDaysLost: 0 };
    entry.count += 1;
    entry.lti += incident.lti ? 1 : 0;
    entry.manDaysLost += incident.manDaysLost ?? 0;
    if (extra) extra(entry, incident);
    groups.set(key, entry);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

const toISO = (date) => date.toISOString().slice(0, 10);
