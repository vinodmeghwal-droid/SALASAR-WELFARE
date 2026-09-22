import { logger } from '../lib/logger.js';
import { eventBus } from '../lib/eventBus.js';
import { MonthlyReturn, SyncLog, SyncState, WorkbookMeta } from '../models/index.js';
import { parseOfficerReturnWorkbook } from '../parsers/officerReturn/index.js';
import { buildMonthRecord } from '../domain/officerReturn/monthRecord.js';
import { checkAnnualSummary } from '../domain/officerReturn/dataChecks.js';

const STATE_KEY = 'officer-return';

/**
 * Change detection → download → parse → persist → broadcast.
 *
 * Every poll does one cheap metadata call. Only when the file's revision differs
 * from the last ingested one is the workbook downloaded and re-parsed.
 * Concurrent calls share the in-flight run.
 */
export function createSyncService({ source }) {
  let inFlight = null;

  async function run({ trigger, force }) {
    const startedAt = Date.now();
    const metadata = await source.getMetadata();
    const state = await SyncState.findOne({ key: STATE_KEY }).lean();

    if (!force && state?.revision === metadata.revision && state?.status !== 'error') {
      await SyncState.updateOne({ key: STATE_KEY }, { lastCheckedAt: new Date() });
      return { changed: false, changedMonths: [], revision: metadata.revision };
    }

    await SyncState.updateOne({ key: STATE_KEY }, { status: 'syncing', lastCheckedAt: new Date() }, { upsert: true });
    eventBus.emit('sync:started', { trigger });

    try {
      const buffer = await source.download(metadata);
      const parsed = await parseOfficerReturnWorkbook(buffer);
      if (!parsed.fy) throw new Error('Could not determine the financial year from the workbook titles');

      const records = parsed.months.map((m) => buildMonthRecord({ ...m, fy: m.fy ?? parsed.fy }));
      const previous = await MonthlyReturn.find({ fy: parsed.fy }, { month: 1, contentHash: 1 }).lean();
      const previousHash = Object.fromEntries(previous.map((p) => [p.month, p.contentHash]));
      const changedMonths = records.filter((r) => previousHash[r.month] !== r.contentHash).map((r) => r.month);

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

      const now = new Date();
      await SyncState.updateOne(
        { key: STATE_KEY },
        {
          source: source.kind,
          fileId: metadata.fileId,
          fileName: metadata.fileName,
          mimeType: metadata.mimeType,
          webViewLink: metadata.webViewLink,
          fy: parsed.fy,
          revision: metadata.revision,
          sourceModifiedTime: metadata.modifiedTime,
          status: 'idle',
          error: null,
          lastSyncedAt: now,
          ...(changedMonths.length ? { lastChangeAt: now } : {}),
        },
        { upsert: true },
      );

      const result = { changed: true, changedMonths, revision: metadata.revision, fy: parsed.fy };
      await SyncLog.create({ trigger, status: 'success', revision: metadata.revision, changedMonths, durationMs: Date.now() - startedAt });
      logger.info(`Sync (${trigger}) ingested revision ${metadata.revision}; changed: ${changedMonths.join(', ') || 'none'}`);
      eventBus.emit('sync:completed', { ...result, syncedAt: now.toISOString() });
      return result;
    } catch (error) {
      await SyncState.updateOne({ key: STATE_KEY }, { status: 'error', error: error.message }, { upsert: true });
      await SyncLog.create({ trigger, status: 'error', revision: metadata.revision, error: error.message, durationMs: Date.now() - startedAt });
      eventBus.emit('sync:failed', { error: error.message });
      throw error;
    }
  }

  return {
    sync({ trigger = 'manual', force = false } = {}) {
      inFlight ??= run({ trigger, force }).finally(() => {
        inFlight = null;
      });
      return inFlight;
    },

    async getStatus() {
      const [state, recent] = await Promise.all([
        SyncState.findOne({ key: STATE_KEY }).lean(),
        SyncLog.find().sort({ createdAt: -1 }).limit(10).lean(),
      ]);
      return {
        source: state?.source ?? source.kind,
        status: state?.status ?? 'idle',
        error: state?.error ?? null,
        fileName: state?.fileName ?? null,
        webViewLink: state?.webViewLink ?? null,
        fy: state?.fy ?? null,
        sourceModifiedTime: state?.sourceModifiedTime ?? null,
        lastCheckedAt: state?.lastCheckedAt ?? null,
        lastSyncedAt: state?.lastSyncedAt ?? null,
        lastChangeAt: state?.lastChangeAt ?? null,
        history: recent.map(({ _id, __v, ...log }) => log),
      };
    },
  };
}
