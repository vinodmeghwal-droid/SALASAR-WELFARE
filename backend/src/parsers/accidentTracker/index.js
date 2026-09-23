import { readWorkbook } from '../workbookReader.js';
import { clean, isBlank, normalizeKey, slugify, toISODate, toNumber, toText } from '../cellUtils.js';
import {
  MONTHLY_KPI_COLUMNS,
  SHEETS,
  TRACKER_BOOLEAN_FIELDS,
  TRACKER_COLUMNS,
  TRACKER_DATE_FIELDS,
  TRACKER_NUMBER_FIELDS,
  YES,
  fyFromMonths,
  monthIdFromISODate,
  parseMonthLabel,
} from './schema.js';

/**
 * Parse the Safety Accident Tracker workbook into plain JSON.
 * Pure: no I/O beyond reading the buffer. KPIs are computed in src/domain/accidentTracker.
 *
 * @returns {{ fy, title, reportingPeriod, months, incidents, sheetMonthlyKpi, sheetDashboard }}
 */
export async function parseAccidentTrackerWorkbook(buffer) {
  const sheets = await readWorkbook(buffer);
  const find = (re) => sheets.find((s) => re.test(s.name));

  const trackerSheet = find(SHEETS.tracker);
  const kpiSheet = find(SHEETS.monthlyKpi);
  const dashboardSheet = find(SHEETS.dashboard);
  if (!trackerSheet) throw new Error('No "Accident Tracker" sheet found in the workbook');

  const incidents = parseIncidents(trackerSheet.rows);
  const { months, rows: sheetMonthlyKpi } = parseMonthlyKpi(kpiSheet?.rows ?? []);
  const dashboard = parseDashboard(dashboardSheet?.rows ?? []);

  return {
    fy: fyFromMonths(months),
    title: dashboard.title,
    reportingPeriod: dashboard.reportingPeriod,
    months,
    incidents,
    sheetMonthlyKpi,
    sheetDashboard: dashboard,
  };
}

// ---------------------------------------------------------------------------
// "Accident Tracker" — the incident register
// ---------------------------------------------------------------------------

function parseIncidents(rows) {
  const [headerRow, ...dataRows] = rows;
  const columns = (headerRow ?? []).map((cell) =>
    isBlank(cell) ? null : (TRACKER_COLUMNS[normalizeKey(cell)] ?? camelCase(cell)),
  );

  const incidents = [];
  dataRows.forEach((row, i) => {
    const incident = {};
    columns.forEach((field, c) => {
      if (!field) return;
      const cell = row[c];
      if (TRACKER_BOOLEAN_FIELDS.includes(field)) incident[field] = YES.test(clean(cell));
      else if (TRACKER_NUMBER_FIELDS.includes(field)) incident[field] = toNumber(cell);
      else if (TRACKER_DATE_FIELDS.includes(field)) incident[field] = toISODate(cell);
      else incident[field] = toText(cell);
    });

    // A row counts as an incident only with a date or an identifying detail —
    // the sheet carries stray "Sr No" values in otherwise empty template rows.
    const identified = incident.date || incident.employeeName || incident.accidentType || incident.department;
    if (!identified) return;

    incident.rowNumber = i + 2;
    incident.id = String(incident.accidentId ?? incident.srNo ?? incident.rowNumber);
    incident.monthId = parseMonthLabel(incident.month)?.id ?? monthIdFromISODate(incident.date);
    incident.monthLabel = parseMonthLabel(incident.month)?.label ?? null;
    incidents.push(incident);
  });

  return incidents;
}

// ---------------------------------------------------------------------------
// "Monthly KPI" — the workbook's own roll-up (kept for cross-checking)
// ---------------------------------------------------------------------------

function parseMonthlyKpi(rows) {
  const [headerRow, ...dataRows] = rows;
  const columns = (headerRow ?? []).map((cell) =>
    isBlank(cell) ? null : (MONTHLY_KPI_COLUMNS[normalizeKey(cell)] ?? camelCase(cell)),
  );

  const months = [];
  const parsedRows = [];
  for (const row of dataRows) {
    const month = parseMonthLabel(row[0]);
    if (!month) continue;
    const values = {};
    columns.forEach((field, c) => {
      if (!field || field === 'month') return;
      values[field] = toNumber(row[c]);
    });
    months.push(month);
    parsedRows.push({ monthId: month.id, label: month.label, ...values });
  }
  return { months, rows: parsedRows };
}

// ---------------------------------------------------------------------------
// "Dashboard" — headline tiles, trend table and type counts (all formula-driven)
// ---------------------------------------------------------------------------

function parseDashboard(rows) {
  const title = rows.find((r) => !isBlank(r[0]))?.[0];
  const reportingPeriod = rows
    .slice(0, 4)
    .map((r) => clean(r[0]))
    .find((t) => /reporting period/i.test(t));

  // Tiles are label/value pairs spread across a row, e.g. "Total Accidents" | … | "Total LTI" | …
  const tiles = {};
  rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      const label = clean(cell);
      if (!label || /^\d/.test(label)) return;
      const below = rows[r + 1]?.[c];
      if (!isBlank(below) && typeof below === 'number') tiles[slugify(label)] = below;
    });
  });

  // "KEY RATES" block: label in column A, value in column B.
  const rates = {};
  const rateStart = rows.findIndex((r) => /key rates/i.test(clean(r[0])));
  if (rateStart >= 0) {
    for (const row of rows.slice(rateStart + 1)) {
      const label = clean(row[0]);
      if (!label) break;
      rates[slugify(label)] = toNumber(row[1]);
    }
  }

  // Type counts table ("Type" / "Count"), wherever it sits.
  const typeCounts = [];
  for (const [r, row] of rows.entries()) {
    const c = row.findIndex((cell) => normalizeKey(cell) === 'type');
    if (c < 0 || normalizeKey(row[c + 1]) !== 'count') continue;
    for (const next of rows.slice(r + 1)) {
      const label = clean(next[c]);
      if (!label) break;
      typeCounts.push({ id: slugify(label), label, count: toNumber(next[c + 1]) });
    }
    break;
  }

  return { title: toText(title), reportingPeriod: reportingPeriod ?? null, tiles, rates, typeCounts };
}

function camelCase(text) {
  return clean(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, ch) => ch.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}
