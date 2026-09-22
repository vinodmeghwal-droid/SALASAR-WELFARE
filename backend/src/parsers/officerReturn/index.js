import { readWorkbook } from '../workbookReader.js';
import { clean, isBlank, isPlaceholder, normalizeKey, slugify, toISODate, toNumber, toText } from '../cellUtils.js';
import {
  DATE_FIELDS,
  HEADER_FIELDS,
  HEADER_KEYS,
  NUMERIC_FIELDS,
  REMARKS_RE,
  SECTION_MATCHERS,
  SECTION_TITLE_RE,
  SUMMARY_KEYS,
  isAnnualSummarySheet,
  manpowerGroup,
  monthKeyFromSheetName,
  MONTH_BY_KEY,
} from './schema.js';

/**
 * Parse the Welfare Officer Return workbook into plain JSON.
 * Pure: no I/O besides reading the buffer. KPIs are computed separately in src/domain.
 *
 * @returns {{ fy: string|null, title: string|null, annualSummary: object|null, months: object[] }}
 */
export async function parseOfficerReturnWorkbook(buffer) {
  const sheets = await readWorkbook(buffer);
  const months = [];
  let annualSummary = null;

  for (const sheet of sheets) {
    if (isAnnualSummarySheet(sheet.name)) {
      annualSummary = parseAnnualSummary(sheet.rows);
      continue;
    }
    const monthKey = monthKeyFromSheetName(sheet.name);
    if (monthKey) months.push(parseMonthSheet(sheet.name, monthKey, sheet.rows));
  }

  months.sort((a, b) => a.monthIndex - b.monthIndex);
  const fy = annualSummary?.fy ?? months.find((m) => m.fy)?.fy ?? null;

  return { fy, title: annualSummary?.title ?? null, annualSummary, months };
}

// ---------------------------------------------------------------------------
// Monthly return sheet
// ---------------------------------------------------------------------------

export function parseMonthSheet(sheetName, monthKey, rows) {
  const title = firstText(rows);
  const sectionStarts = [];
  let remarksRow = -1;

  rows.forEach((row, r) => {
    const a = clean(row[0]);
    if (SECTION_TITLE_RE.test(a)) {
      const match = SECTION_MATCHERS.find((m) => m.test.test(a));
      if (match) sectionStarts.push({ id: match.id, title: a.replace(/^[A-Z]\.\s+/, ''), row: r });
    } else if (REMARKS_RE.test(a) && remarksRow < 0) {
      remarksRow = r;
    }
  });

  const firstSectionRow = sectionStarts[0]?.row ?? rows.length;
  const header = parseHeaderBlock(rows.slice(0, firstSectionRow));

  const sections = {};
  sectionStarts.forEach((start, i) => {
    const end = sectionStarts[i + 1]?.row ?? (remarksRow > start.row ? remarksRow : rows.length);
    const body = rows.slice(start.row + 1, end);
    sections[start.id] =
      start.id === 'summary' ? parseSummarySection(start.title, body) : parseTableSection(start.id, start.title, body);
  });

  const month = MONTH_BY_KEY[monthKey];
  return {
    sheetName,
    month: monthKey,
    monthIndex: month.index,
    label: month.label,
    title,
    fy: extractFy(title) ?? extractFy(header.reportingPeriod),
    header,
    sections,
    remarks: remarksRow >= 0 ? collectText(rows.slice(remarksRow + 1)) : null,
  };
}

function parseHeaderBlock(rows) {
  const header = {};
  for (const row of rows) {
    row.forEach((cell, c) => {
      const field = HEADER_FIELDS[normalizeKey(cell)];
      if (!field) return;
      const value = row[c + 1];
      const isLabel = HEADER_FIELDS[normalizeKey(value)];
      header[field] = field === 'declaredTotalWorkers' ? toNumber(value) : isLabel ? null : toText(value);
    });
  }
  return header;
}

function parseTableSection(id, title, body) {
  const rows = body.filter((row) => row.some((cell) => !isBlank(cell)));
  const [headerRow, ...dataRows] = rows;
  const columns = (headerRow ?? []).map((cell) => {
    if (isBlank(cell)) return null; // unlabeled helper columns (e.g. the manpower ratio in col F)
    return HEADER_KEYS[normalizeKey(cell)] ?? camelCase(cell);
  });
  if (columns[0]) columns[0] = 'label';

  const items = [];
  const notes = [];

  for (const row of dataRows) {
    const filled = row.filter((cell) => !isBlank(cell));
    const a = clean(row[0]);
    // A lone long sentence in column A is a free-text note, not a table row.
    if (filled.length === 1 && a && (/^(observation|note|remark)/i.test(a) || a.length > 60)) {
      notes.push(a);
      continue;
    }

    const item = {};
    columns.forEach((key, c) => {
      if (!key) return;
      const cell = row[c];
      if (NUMERIC_FIELDS.has(key)) item[key] = toNumber(cell);
      else if (DATE_FIELDS.has(key)) item[key] = toISODate(cell);
      else item[key] = toText(cell);
    });

    const hasNumbers = [...NUMERIC_FIELDS].some((key) => item[key] > 0);
    if (!item.label && !hasNumbers) continue; // blank template rows (e.g. unused contractor slots)
    item.label ??= 'Unnamed';
    item.id = slugify(item.label);
    if (id === 'manpower') {
      item.group = manpowerGroup(item.label);
      // Closing is a formula; files saved without cached results leave it empty.
      if (isBlank(row[columns.indexOf('closing')]) && item.opening + item.joining > 0) {
        item.closing = item.opening + item.joining - item.separation;
      }
    }
    items.push(item);
  }

  return { title: titleCase(title), columns: columns.filter(Boolean), rows: items, notes };
}

function parseSummarySection(title, body) {
  const values = {};
  const rows = [];
  for (const row of body) {
    const label = clean(row[0]);
    if (!label) continue;
    const key = SUMMARY_KEYS[label.toLowerCase()] ?? camelCase(label);
    values[key] = toNumber(row[1]);
    rows.push({ id: key, label, value: values[key] });
  }
  return { title: titleCase(title), rows, values, notes: [] };
}

// ---------------------------------------------------------------------------
// Annual Summary sheet (as reported by the workbook's own formulas)
// ---------------------------------------------------------------------------

function parseAnnualSummary(rows) {
  const title = firstText(rows);
  const header = parseHeaderBlock(rows.slice(0, 4));
  const kpiHeaderIndex = rows.findIndex((row) => normalizeKey(row[0]) === 'kpi');
  const kpis = [];

  if (kpiHeaderIndex >= 0) {
    const monthColumns = rows[kpiHeaderIndex]
      .map((cell, c) => ({ c, key: monthKeyFromSheetName(clean(cell)), total: /total/i.test(clean(cell)) }))
      .filter((col) => col.key || col.total);

    for (const row of rows.slice(kpiHeaderIndex + 1)) {
      const label = clean(row[0]);
      if (!label) break;
      const byMonth = {};
      let annualTotal = null;
      for (const col of monthColumns) {
        if (col.key) byMonth[col.key] = toNumber(row[col.c]);
        else annualTotal = toNumber(row[col.c]);
      }
      kpis.push({ id: SUMMARY_KEYS[label.toLowerCase()] ?? camelCase(label), label, byMonth, annualTotal });
    }
  }

  const obsIndex = rows.findIndex((row) => /management observations/i.test(clean(row[0])));
  return {
    title,
    fy: extractFy(title),
    factoryName: header.factoryName ?? null,
    welfareOfficer: header.welfareOfficer ?? null,
    kpis,
    observations: obsIndex >= 0 ? collectText(rows.slice(obsIndex + 1)) : null,
  };
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function firstText(rows) {
  for (const row of rows) {
    const cell = row.find((c) => !isBlank(c));
    if (cell !== undefined) return clean(cell);
  }
  return null;
}

function collectText(rows) {
  const text = rows
    .flatMap((row) => row.filter((c) => !isBlank(c)).map(clean))
    .filter((t) => !isPlaceholder(t))
    .join('\n')
    .trim();
  return text || null;
}

function extractFy(text) {
  const match = String(text ?? '').match(/(20\d{2})\s*[-–]\s*(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : null;
}

function camelCase(text) {
  return clean(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, ch) => ch.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

function titleCase(text) {
  return clean(text)
    .toLowerCase()
    .replace(/\b([a-z])/g, (ch) => ch.toUpperCase())
    .replace(/\bOf\b/g, 'of');
}
