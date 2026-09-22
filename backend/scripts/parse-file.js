// Debug helper: parse a local workbook and print the result (no DB, no Drive).
// Usage: npm run parse:file -- <path-to.xlsx> [monthKey]
import { readFile } from 'node:fs/promises';
import { parseOfficerReturnWorkbook } from '../src/parsers/officerReturn/index.js';
import { buildMonthRecord } from '../src/domain/officerReturn/monthRecord.js';

const [path = 'test/fixtures/officer-return-2026-27.xlsx', monthKey] = process.argv.slice(2);
const parsed = await parseOfficerReturnWorkbook(await readFile(path));

if (monthKey) {
  const month = parsed.months.find((m) => m.month === monthKey);
  console.log(JSON.stringify(month && buildMonthRecord(month), null, 2));
} else {
  console.log(`FY ${parsed.fy} — ${parsed.title}`);
  for (const m of parsed.months) {
    const record = buildMonthRecord(m);
    console.log(
      `${m.label.padEnd(10)} hasData=${String(record.hasData).padEnd(5)} closing=${record.kpis.headcountClosing} checks=${record.checks.length}`,
    );
  }
}
