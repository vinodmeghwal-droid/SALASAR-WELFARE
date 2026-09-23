import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseAccidentTrackerWorkbook } from '../src/parsers/accidentTracker/index.js';
import { buildAccidentRecord } from '../src/domain/accidentTracker/record.js';
import { monthManHours } from '../src/domain/accidentTracker/kpis.js';
import { parseMonthLabel } from '../src/parsers/accidentTracker/schema.js';

const fixture = new URL('./fixtures/accident-tracker-2026-27.xlsx', import.meta.url);
const parsed = await parseAccidentTrackerWorkbook(await readFile(fixture));
const record = buildAccidentRecord(parsed);

test('reads the May→April year from the Monthly KPI sheet', () => {
  assert.equal(record.fy, '2026-27');
  assert.deepEqual(
    record.months.map((m) => m.monthId),
    ['may-26', 'jun-26', 'jul-26', 'aug-26', 'sep-26', 'oct-26', 'nov-26', 'dec-26', 'jan-27', 'feb-27', 'mar-27', 'apr-27'],
  );
  assert.deepEqual(parseMonthLabel('May-26'), { id: 'may-26', label: 'May 2026', monthIndex: 4, year: 2026 });
});

test('reads incidents and ignores stray template rows', () => {
  assert.equal(record.incidents.length, 1); // the sheet has a stray "Sr No" at row 480
  const incident = record.incidents[0];
  assert.equal(incident.date, '2026-05-08');
  assert.equal(incident.monthId, 'may-26');
  assert.equal(incident.lti, true);
  assert.equal(incident.fatality, false);
  assert.equal(incident.manDaysLost, 20);
});

test('computes LTIFR and severity rate per 1,000,000 man-hours', () => {
  assert.equal(record.totals.ltifr, 250); // 1 × 1e6 / 4000
  assert.equal(record.totals.severityRate, 5000); // 20 × 1e6 / 4000
  assert.equal(record.totals.ltiPercentOfAccidents, 100);
  assert.equal(record.months.find((m) => m.monthId === 'may-26').kpis.ltifr, 250);
});

test('man-hours are a monthly figure, not summed across rows', () => {
  assert.equal(monthManHours([{ manHoursWorked: 4000 }, { manHoursWorked: 4000 }]), 4000);
  assert.equal(monthManHours([]), 0);
});

test('flags the near-miss/injury contradiction and reversed dates', () => {
  const ids = record.checks.map((c) => c.id);
  assert.ok(ids.some((id) => id.startsWith('contradiction-')));
  assert.ok(ids.includes('targetDate-before-1'));
  assert.ok(ids.includes('closureDate-before-1'));
  assert.ok(ids.includes('dashboard-key-rates')); // workbook's KEY RATES always read 0
});

test('breakdowns group incidents by dimension', () => {
  assert.deepEqual(record.breakdowns.byDepartment, [{ id: 'hsd', label: 'HSD', count: 1, lti: 1, manDaysLost: 20 }]);
  assert.equal(record.breakdowns.byContractor[0].label, 'Not specified');
  assert.equal(record.capa.closed, 1);
});
