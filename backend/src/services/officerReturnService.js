import { MonthlyReturn, WorkbookMeta } from '../models/index.js';
import { buildAnnualOverview } from '../domain/officerReturn/annual.js';
import { MONTH_BY_KEY } from '../parsers/officerReturn/schema.js';
import { notFound } from '../lib/httpError.js';

const MONTH_PROJECTION = { _id: 0, __v: 0, contentHash: 0 };

async function resolveFy(fy) {
  if (fy) return fy;
  const latest = await WorkbookMeta.findOne({}, { fy: 1 }).sort({ fy: -1 }).lean();
  if (!latest) throw notFound('No data synced yet. Check the sync status.');
  return latest.fy;
}

export async function listFinancialYears() {
  const metas = await WorkbookMeta.find({}, { fy: 1 }).sort({ fy: -1 }).lean();
  return metas.map((m) => m.fy);
}

/** Everything the "Annual Summary" view needs in one request. */
export async function getOverview(fyParam) {
  const fy = await resolveFy(fyParam);
  const [meta, records] = await Promise.all([
    WorkbookMeta.findOne({ fy }).lean(),
    MonthlyReturn.find({ fy }, MONTH_PROJECTION).sort({ monthIndex: 1 }).lean(),
  ]);
  if (!meta) throw notFound(`No workbook for FY ${fy}`);

  // Each header field from the most recent month that filled it in (officers often leave it blank).
  const headers = records.filter((r) => r.hasData).map((r) => r.header ?? {}).reverse();
  const latestHeader = Object.fromEntries(
    ['factoryName', 'address', 'licenceNo', 'welfareOfficer'].map((f) => [f, headers.find((h) => h[f])?.[f] ?? null]),
  );
  const overview = buildAnnualOverview(records);

  return {
    fy,
    title: meta.title,
    factory: {
      name: latestHeader.factoryName ?? meta.annualSummary?.factoryName ?? null,
      address: latestHeader.address ?? null,
      licenceNo: latestHeader.licenceNo ?? null,
      welfareOfficer: latestHeader.welfareOfficer ?? meta.annualSummary?.welfareOfficer ?? null,
    },
    source: {
      fileId: meta.fileId,
      fileName: meta.fileName,
      webViewLink: meta.webViewLink,
      modifiedTime: meta.sourceModifiedTime,
    },
    ...overview,
    sheetSummary: meta.annualSummary?.kpis ?? [],
    observations: meta.annualSummary?.observations ?? null,
    checks: [...(meta.checks ?? []), ...records.flatMap((r) => r.checks ?? [])],
    updatedAt: meta.updatedAt,
  };
}

/** Full detail of one month return. */
export async function getMonth(monthKey, fyParam) {
  if (!MONTH_BY_KEY[monthKey]) throw notFound(`Unknown month "${monthKey}"`);
  const fy = await resolveFy(fyParam);
  const record = await MonthlyReturn.findOne({ fy, month: monthKey }, MONTH_PROJECTION).lean();
  if (!record) throw notFound(`No ${MONTH_BY_KEY[monthKey].label} sheet in FY ${fy}`);
  return record;
}
