import { AccidentReturn } from '../models/index.js';
import { notFound } from '../lib/httpError.js';

const OVERVIEW_PROJECTION = { _id: 0, __v: 0, contentHash: 0, incidents: 0 };

async function resolveFy(fy) {
  if (fy) return fy;
  const latest = await AccidentReturn.findOne({}, { fy: 1 }).sort({ fy: -1 }).lean();
  if (!latest) throw notFound('No accident data synced yet. Check the sync status.');
  return latest.fy;
}

export async function listFinancialYears() {
  const docs = await AccidentReturn.find({}, { fy: 1 }).sort({ fy: -1 }).lean();
  return docs.map((d) => d.fy);
}

/** Headline KPIs, monthly series, breakdowns and checks — everything except the incident rows. */
export async function getOverview(fyParam) {
  const fy = await resolveFy(fyParam);
  const doc = await AccidentReturn.findOne({ fy }, OVERVIEW_PROJECTION).lean();
  if (!doc) throw notFound(`No accident workbook for FY ${fy}`);
  return doc;
}

/** The incident register, optionally filtered. */
export async function getIncidents(fyParam, { month, type, status, department } = {}) {
  const fy = await resolveFy(fyParam);
  const doc = await AccidentReturn.findOne({ fy }, { _id: 0, incidents: 1, fy: 1 }).lean();
  if (!doc) throw notFound(`No accident workbook for FY ${fy}`);

  const matches = (value, filter) => !filter || String(value ?? '').toLowerCase() === filter.toLowerCase();
  const incidents = doc.incidents.filter(
    (i) =>
      matches(i.monthId, month) &&
      matches(i.accidentType, type) &&
      matches(i.status, status) &&
      matches(i.department, department),
  );
  return { fy: doc.fy, count: incidents.length, incidents };
}
