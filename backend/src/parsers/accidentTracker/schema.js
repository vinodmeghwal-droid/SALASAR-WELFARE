/**
 * Description of the "Safety Accident Tracker / LTI Dashboard" workbook.
 * Sheets: "Accident Tracker" (one row per incident — the source of truth),
 * "Monthly KPI" (formula roll-up), "Dashboard" (formula tiles), "Instructions".
 *
 * Note: this workbook's year runs May → April, unlike the Officer Return (Apr → Mar).
 */

export const SHEETS = {
  tracker: /accident\s*tracker/i,
  monthlyKpi: /monthly\s*kpi/i,
  dashboard: /dashboard/i,
  instructions: /instruction/i,
};

/** Incident register column header → field. Unknown headers are camelCased. */
export const TRACKER_COLUMNS = {
  'sr no': 'srNo',
  'accident id': 'accidentId',
  date: 'date',
  month: 'month',
  'employee name': 'employeeName',
  'pay code': 'payCode',
  department: 'department',
  section: 'section',
  designation: 'designation',
  'employment type': 'employmentType',
  contractor: 'contractor',
  'accident type': 'accidentType',
  'injury type': 'injuryType',
  'lti (y/n)': 'lti',
  'fatality (y/n)': 'fatality',
  'first aid (y/n)': 'firstAid',
  'hospitalization (y/n)': 'hospitalization',
  'near miss (y/n)': 'nearMiss',
  'man-days lost': 'manDaysLost',
  'man-hours worked (month)': 'manHoursWorked',
  'lost work days': 'lostWorkDays',
  'root cause': 'rootCause',
  'corrective action': 'correctiveAction',
  'responsible person': 'responsiblePerson',
  'target date': 'targetDate',
  'closure date': 'closureDate',
  status: 'status',
  remarks: 'remarks',
};

export const TRACKER_BOOLEAN_FIELDS = ['lti', 'fatality', 'firstAid', 'hospitalization', 'nearMiss'];
export const TRACKER_NUMBER_FIELDS = ['srNo', 'payCode', 'manDaysLost', 'manHoursWorked', 'lostWorkDays'];
export const TRACKER_DATE_FIELDS = ['date', 'targetDate', 'closureDate'];

/** "Monthly KPI" header → field (the sheet's own computed values, kept for cross-checking). */
export const MONTHLY_KPI_COLUMNS = {
  month: 'month',
  'total accidents': 'totalAccidents',
  lti: 'lti',
  fatalities: 'fatalities',
  'major accidents': 'majorAccidents',
  'minor accidents': 'minorAccidents',
  'near miss': 'nearMiss',
  'first aid': 'firstAid',
  hospitalization: 'hospitalization',
  'man-days lost': 'manDaysLost',
  'man-hours worked': 'manHoursWorked',
  ltifr: 'ltifr',
  'accident rate / 100 workers': 'accidentRatePer100',
  'severity rate': 'severityRate',
  'lti % of accidents': 'ltiPercentOfAccidents',
};

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * "May-26" → { id: 'may-26', label: 'May 2026', monthIndex: 4, year: 2026 }.
 * The workbook writes months this way in both the tracker and the KPI sheet.
 */
export function parseMonthLabel(value) {
  const match = String(value ?? '')
    .trim()
    .match(/^([A-Za-z]{3,})[-\s/]?(\d{2,4})$/);
  if (!match) return null;
  const monthIndex = MONTH_NAMES.indexOf(match[1].slice(0, 3).toLowerCase());
  if (monthIndex < 0) return null;
  const year = match[2].length === 2 ? 2000 + Number(match[2]) : Number(match[2]);
  return {
    id: `${MONTH_NAMES[monthIndex]}-${String(year).slice(2)}`,
    label: `${match[1].slice(0, 3).replace(/^./, (c) => c.toUpperCase())} ${year}`,
    monthIndex,
    year,
  };
}

/** Month id for a date cell, so incidents can be grouped even if the Month column is blank. */
export function monthIdFromISODate(iso) {
  const match = /^(\d{4})-(\d{2})/.exec(iso ?? '');
  if (!match) return null;
  return `${MONTH_NAMES[Number(match[2]) - 1]}-${match[1].slice(2)}`;
}

/** Financial year label from the first and last month of the KPI sheet: "2026-27". */
export function fyFromMonths(months) {
  if (!months.length) return null;
  const start = months[0];
  const end = months.at(-1);
  return start.year === end.year ? String(start.year) : `${start.year}-${String(end.year).slice(2)}`;
}

export const YES = /^(y|yes|true|1)$/i;
