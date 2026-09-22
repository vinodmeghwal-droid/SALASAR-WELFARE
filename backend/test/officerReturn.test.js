import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseOfficerReturnWorkbook } from '../src/parsers/officerReturn/index.js';
import { buildMonthRecord } from '../src/domain/officerReturn/monthRecord.js';
import { buildAnnualOverview } from '../src/domain/officerReturn/annual.js';
import { checkAnnualSummary } from '../src/domain/officerReturn/dataChecks.js';

const fixture = new URL('./fixtures/officer-return-2026-27.xlsx', import.meta.url);
const parsed = await parseOfficerReturnWorkbook(await readFile(fixture));
const records = parsed.months.map(buildMonthRecord);
const sep = records.find((m) => m.month === 'sep');

test('reads FY and all 12 month sheets in financial-year order', () => {
  assert.equal(parsed.fy, '2026-27');
  assert.deepEqual(
    records.map((m) => m.month),
    ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'],
  );
});

test('only September has submitted data; blank templates are not "submitted"', () => {
  assert.deepEqual(
    records.filter((m) => m.hasData).map((m) => m.month),
    ['sep'],
  );
});

test('locates sections by title even though Sep has an inserted row', () => {
  assert.equal(sep.header.welfareOfficer, 'Vinod Meghwal');
  assert.equal(sep.sections.accidents.notes.length, 1);
  assert.equal(sep.sections.grievances.rows[0].label, 'Worker Grievances');
  assert.equal(sep.sections.contractors.rows.length, 5); // blank contractor slots skipped
});

test('computes headcount from employment-type rows, not the double-counted TOTAL row', () => {
  assert.equal(sep.kpis.headcountOpening, 118);
  assert.equal(sep.kpis.headcountClosing, 124);
  assert.equal(sep.kpis.maleWorkers + sep.kpis.femaleWorkers, 124);
  assert.ok(sep.checks.some((c) => c.id === 'sep:manpower-total-row'));
});

test('computed KPIs match the detail sections', () => {
  const k = sep.kpis;
  assert.equal(k.grievancesReceived, 7);
  assert.equal(k.grievanceResolutionRate, 100);
  assert.equal(k.safetyIncidents, 6);
  assert.equal(k.medicalCases, 30);
  assert.equal(k.welfareActivities, 11);
  assert.equal(k.inspections, 4);
  assert.equal(k.trainingSessions, 6);
  assert.equal(k.trainingParticipants, 185);
  assert.equal(k.statutoryComplianceRate, 100);
});

test('flags the shifted Annual Summary tab', () => {
  const checks = checkAnnualSummary(parsed.annualSummary, records);
  assert.equal(checks.length, 1);
  assert.match(checks[0].detail, /Grievances Received: tab 11 vs return 7/);
});

test('annual overview leaves unsubmitted months as gaps', () => {
  const overview = buildAnnualOverview(records);
  assert.equal(overview.latestMonth, 'sep');
  assert.equal(overview.ytd.grievancesReceived, 7);
  assert.equal(overview.trend.find((p) => p.month === 'apr').headcountClosing, null);
  assert.equal(overview.trend.find((p) => p.month === 'sep').headcountClosing, 124);
});
