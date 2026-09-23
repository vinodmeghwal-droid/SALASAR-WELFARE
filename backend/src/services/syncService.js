import { logger } from '../lib/logger.js';
import { eventBus } from '../lib/eventBus.js';
import { SyncLog, SyncState } from '../models/index.js';

/**
 * Change detection → download → ingest → broadcast, for one dataset (one workbook).
 *
 * Every poll does one cheap metadata call. Only when the file's revision differs
 * from the last ingested one is the workbook downloaded and re-parsed.
 * Concurrent calls share the in-flight run.
 *
 * @param {{ dataset: {key: string, label: string}, source: object,
 *           ingest: (args: {buffer: Buffer, metadata: object}) => Promise<{fy: string, changedItems: string[]}> }} deps
 */
export function createSyncService({ dataset, source, ingest }) {
  const key = dataset.key;
  let inFlight = null;

  async function run({ trigger, force }) {
    const startedAt = Date.now();
    const metadata = await source.getMetadata();
    const state = await SyncState.findOne({ key }).lean();

    if (!force && state?.revision === metadata.revision && state?.status !== 'error') {
      await SyncState.updateOne({ key }, { lastCheckedAt: new Date() });
      return { dataset: key, changed: false, changedItems: [], revision: metadata.revision };
    }

    await SyncState.updateOne({ key }, { status: 'syncing', lastCheckedAt: new Date() }, { upsert: true });
    eventBus.emit('sync:started', { dataset: key, trigger });

    try {
      const buffer = await source.download(metadata);
      const { fy, changedItems } = await ingest({ buffer, metadata });

      const now = new Date();
      await SyncState.updateOne(
        { key },
        {
          label: dataset.label,
          source: source.kind,
          fileId: metadata.fileId,
          fileName: metadata.fileName,
          mimeType: metadata.mimeType,
          webViewLink: metadata.webViewLink,
          fy,
          revision: metadata.revision,
          sourceModifiedTime: metadata.modifiedTime,
          status: 'idle',
          error: null,
          lastSyncedAt: now,
          ...(changedItems.length ? { lastChangeAt: now } : {}),
        },
        { upsert: true },
      );

      const result = { dataset: key, label: dataset.label, changed: true, changedItems, revision: metadata.revision, fy };
      await SyncLog.create({
        dataset: key,
        trigger,
        status: 'success',
        revision: metadata.revision,
        changedItems,
        durationMs: Date.now() - startedAt,
      });
      logger.info(`Sync ${key} (${trigger}) ingested ${metadata.revision}; changed: ${changedItems.join(', ') || 'none'}`);
      eventBus.emit('sync:completed', { ...result, syncedAt: now.toISOString() });
      return result;
    } catch (error) {
      await SyncState.updateOne({ key }, { status: 'error', error: error.message }, { upsert: true });
      await SyncLog.create({
        dataset: key,
        trigger,
        status: 'error',
        revision: metadata.revision,
        error: error.message,
        durationMs: Date.now() - startedAt,
      });
      eventBus.emit('sync:failed', { dataset: key, label: dataset.label, error: error.message });
      throw error;
    }
  }

  return {
    key,
    label: dataset.label,

    sync({ trigger = 'manual', force = false } = {}) {
      inFlight ??= run({ trigger, force }).finally(() => {
        inFlight = null;
      });
      return inFlight;
    },

    async getStatus() {
      const [state, recent] = await Promise.all([
        SyncState.findOne({ key }).lean(),
        SyncLog.find({ dataset: key }).sort({ createdAt: -1 }).limit(10).lean(),
      ]);
      return {
        key,
        label: dataset.label,
        source: state?.source ?? source.kind,
        status: state?.status ?? 'idle',
        error: state?.error ?? null,
        fileId: state?.fileId ?? null,
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

/** Fan-out helper: one registry for every dataset's sync service. */
export function createSyncRegistry(services) {
  const byKey = new Map(services.map((s) => [s.key, s]));
  return {
    all: services,
    get: (key) => byKey.get(key),
    async syncAll({ trigger = 'manual', force = false } = {}) {
      const results = await Promise.allSettled(services.map((s) => s.sync({ trigger, force })));
      return results.map((r, i) =>
        r.status === 'fulfilled' ? r.value : { dataset: services[i].key, changed: false, error: r.reason.message },
      );
    },
    statuses: () => Promise.all(services.map((s) => s.getStatus())),
  };
}
