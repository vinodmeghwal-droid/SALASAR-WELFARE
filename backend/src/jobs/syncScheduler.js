import { logger } from '../lib/logger.js';

/**
 * Polls the source every `intervalSeconds`. Polling is one metadata request,
 * so a 30s interval stays far below Drive API quotas.
 */
export function startSyncScheduler(syncService, { intervalSeconds }) {
  let stopped = false;
  let timer = null;

  const tick = async (trigger) => {
    try {
      await syncService.sync({ trigger });
    } catch (error) {
      logger.error(`Sync (${trigger}) failed: ${error.message}`);
    } finally {
      if (!stopped) timer = setTimeout(() => tick('poll'), intervalSeconds * 1000);
    }
  };

  tick('startup');
  logger.info(`Sync scheduler started (every ${intervalSeconds}s)`);

  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
