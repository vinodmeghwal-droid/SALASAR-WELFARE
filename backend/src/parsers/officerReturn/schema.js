/**
 * Declarative description of the "Welfare Officer Return" workbook.
 * The parser locates everything by title/label text, never by fixed row numbers,
 * because officers insert rows (e.g. the Sep sheet has an extra "Observation" row).
 */

/** Financial-year order (Apr → Mar). `index` is the sort key. */
export const FY_MONTHS = [
  { key: 'apr', label: 'April', short: 'Apr' },
  { key: 'may', label: 'May', short: 'May' },
  { key: 'jun', label: 'June', short: 'Jun' },
  { key: 'jul', label: 'July', short: 'Jul' },
  { key: 'aug', label: 'August', short: 'Aug' },
  { key: 'sep', label: 'September', short: 'Sep' },
  { key: 'oct', label: 'October', short: 'Oct' },
  { key: 'nov', label: 'November', short: 'Nov' },
  { key: 'dec', label: 'December', short: 'Dec' },
  { key: 'jan', label: 'January', short: 'Jan' },
  { key: 'feb', label: 'February', short: 'Feb' },
  { key: 'mar', label: 'March', short: 'Mar' },
].map((m, index) => ({ ...m, index }));

export const MONTH_BY_KEY = Object.fromEntries(FY_MONTHS.map((m) => [m.key, m]));

/** "Sep", "SEPT", "September" → "sep" */
export function monthKeyFromSheetName(name) {
  const key = String(name).trim().slice(0, 3).toLowerCase();
  return MONTH_BY_KEY[key] ? key : null;
}

export const isAnnualSummarySheet = (name) => /annual\s*summary/i.test(name);

/** Section title (column A, e.g. "D. ACCIDENT STATEMENT") → section id. Order matters: first match wins. */
export const SECTION_MATCHERS = [
  { id: 'summary', test: /monthly welfare summary/i },
  { id: 'manpower', test: /manpower/i },
  { id: 'facilities', test: /facilit/i },
  { id: 'health', test: /health|medical/i },
  { id: 'accidents', test: /accident/i },
  { id: 'grievances', test: /grievance/i },
  { id: 'activities', test: /activit/i },
  { id: 'contractors', test: /contractor/i },
  { id: 'training', test: /training/i },
  { id: 'compliance', test: /statutory|compliance/i },
];

export const SECTION_TITLE_RE = /^[A-Z]\.\s+\S/;
export const REMARKS_RE = /^welfare officer remarks/i;

/** Table header text → field key. Unknown headers fall back to camelCase of the header. */
export const HEADER_KEYS = {
  category: 'label',
  facility: 'label',
  particular: 'label',
  activity: 'label',
  contractor: 'label',
  training: 'label',
  compliance: 'label',
  opening: 'opening',
  joining: 'joining',
  separation: 'separation',
  closing: 'closing',
  'available (y/n)': 'available',
  'no./capacity': 'capacity',
  condition: 'condition',
  observation: 'observation',
  observations: 'observations',
  'action required': 'actionRequired',
  count: 'count',
  remarks: 'remarks',
  'no. of cases': 'cases',
  'man-days lost': 'manDaysLost',
  received: 'received',
  resolved: 'resolved',
  pending: 'pending',
  'no. conducted': 'conducted',
  participants: 'participants',
  'action taken': 'actionTaken',
  manpower: 'manpower',
  attendance: 'attendance',
  'wage payment': 'wagePayment',
  pf: 'pf',
  esic: 'esic',
  'lwf/pt': 'lwfPt',
  date: 'date',
  trainer: 'trainer',
  status: 'status',
  'due date': 'dueDate',
  'corrective action': 'correctiveAction',
};

export const NUMERIC_FIELDS = new Set([
  'opening',
  'joining',
  'separation',
  'closing',
  'count',
  'cases',
  'manDaysLost',
  'received',
  'resolved',
  'pending',
  'conducted',
  'participants',
  'manpower',
]);

export const DATE_FIELDS = new Set(['date', 'dueDate']);

/** Contractor statutory columns checked for "Complied". */
export const CONTRACTOR_CHECKS = ['attendance', 'wagePayment', 'pf', 'esic', 'lwfPt'];

/** Header block above section A: label text → field key. */
export const HEADER_FIELDS = {
  'factory name': 'factoryName',
  'factory licence no.': 'licenceNo',
  'factory license no.': 'licenceNo',
  address: 'address',
  'reporting period': 'reportingPeriod',
  'welfare officer': 'welfareOfficer',
  'total workers': 'declaredTotalWorkers',
};

/** Rows of section J, keyed so they can be cross-checked against computed KPIs. */
export const SUMMARY_KEYS = {
  'total workers': 'totalWorkers',
  'welfare activities': 'welfareActivities',
  'grievances received': 'grievancesReceived',
  'grievances resolved': 'grievancesResolved',
  accidents: 'accidents',
  'medical cases': 'medicalCases',
  'training sessions': 'trainingSessions',
  inspections: 'inspections',
  'welfare inspections': 'inspections',
};

/** Manpower rows split into two independent breakdowns of the same workforce. */
export function manpowerGroup(label) {
  if (/^total/i.test(label)) return 'total';
  if (/male|female|gender/i.test(label)) return 'gender';
  return 'type';
}
