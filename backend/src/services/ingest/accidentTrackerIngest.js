import { AccidentReturn } from '../../models/index.js';
import { parseAccidentTrackerWorkbook } from '../../parsers/accidentTracker/index.js';
import { buildAccidentRecord } from '../../domain/accidentTracker/record.js';

/** Parses the Safety Accident Tracker workbook and upserts one document per financial year. */
export async function ingestAccidentTracker({ buffer, metadata }) {
  const parsed = await parseAccidentTrackerWorkbook(buffer);
  const record = buildAccidentRecord(parsed);
  if (!record.fy) throw new Error('Could not determine the financial year from the Monthly KPI sheet');

  const previous = await AccidentReturn.findOne({ fy: record.fy }, { contentHash: 1 }).lean();
  const changedItems = previous?.contentHash === record.contentHash ? [] : ['register'];

  await AccidentReturn.replaceOne(
    { fy: record.fy },
    {
      ...record,
      fileId: metadata.fileId,
      fileName: metadata.fileName,
      webViewLink: metadata.webViewLink,
      sourceRevision: metadata.revision,
      sourceModifiedTime: metadata.modifiedTime,
    },
    { upsert: true },
  );

  return { fy: record.fy, changedItems };
}
