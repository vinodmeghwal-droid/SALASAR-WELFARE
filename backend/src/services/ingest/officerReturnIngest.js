import { MonthlyReturn, WorkbookMeta } from '../../models/index.js';
import { parseOfficerReturnWorkbook } from '../../parsers/officerReturn/index.js';
import { buildMonthRecord } from '../../domain/officerReturn/monthRecord.js';
import { checkAnnualSummary } from '../../domain/officerReturn/dataChecks.js';

/** Parses the Welfare Officer Return workbook and upserts one document per month. */
export async function ingestOfficerReturn({ buffer, metadata }) {
  const parsed = await parseOfficerReturnWorkbook(buffer);
  if (!parsed.fy) throw new Error('Could not determine the financial year from the workbook titles');

  const records = parsed.months.map((m) => buildMonthRecord({ ...m, fy: m.fy ?? parsed.fy }));
  const previous = await MonthlyReturn.find({ fy: parsed.fy }, { month: 1, contentHash: 1 }).lean();
  const previousHash = Object.fromEntries(previous.map((p) => [p.month, p.contentHash]));
  const changedItems = records.filter((r) => previousHash[r.month] !== r.contentHash).map((r) => r.month);

  await MonthlyReturn.bulkWrite(
    records.map((record) => ({
      replaceOne: {
        filter: { fy: parsed.fy, month: record.month },
        replacement: { ...record, fy: parsed.fy, sourceRevision: metadata.revision },
        upsert: true,
      },
    })),
  );

  await WorkbookMeta.updateOne(
    { fy: parsed.fy },
    {
      fy: parsed.fy,
      title: parsed.title,
      fileId: metadata.fileId,
      fileName: metadata.fileName,
      webViewLink: metadata.webViewLink,
      annualSummary: parsed.annualSummary,
      checks: checkAnnualSummary(parsed.annualSummary, records),
      sourceRevision: metadata.revision,
      sourceModifiedTime: metadata.modifiedTime,
    },
    { upsert: true },
  );

  return { fy: parsed.fy, changedItems };
}
