import { createHash } from 'node:crypto';
import { computeMonthKpis, monthHasData } from './kpis.js';
import { checkMonth } from './dataChecks.js';

/** Parsed month sheet → the record persisted in MongoDB and served to the dashboard. */
export function buildMonthRecord(parsedMonth) {
  const kpis = computeMonthKpis(parsedMonth.sections);
  const hasData = monthHasData(kpis);
  return {
    ...parsedMonth,
    kpis,
    hasData,
    checks: hasData ? checkMonth(parsedMonth, kpis) : [],
    contentHash: hashOf({ header: parsedMonth.header, sections: parsedMonth.sections, remarks: parsedMonth.remarks }),
  };
}

export function hashOf(value) {
  return createHash('sha1').update(JSON.stringify(value)).digest('hex');
}
