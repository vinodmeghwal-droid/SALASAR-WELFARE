import { logger } from '../lib/logger.js';

/**
 * Polls every dataset's source on an interval. Each poll is one metadata request per
 * workbook, so a 30s interval stays far below Drive API quotas.
 */
export function startSyncScheduler(registry, { intervalSeconds }) {
  let stopped = false;
  const timers = [];

  for (const service of registry.all) {
    const tick = async (trigger) => {
      try {
        await service.sync({ trigger });
      } catch (error) {
        logger.error(`Sync ${service.key} (${trigger}) failed: ${error.message}`);
      } finally {
        if (!stopped) timers.push(setTimeout(() => tick('poll'), intervalSeconds * 1000));
      }
    };
    tick('startup');
  }

  logger.info(`Sync scheduler started for ${registry.all.length} dataset(s) (every ${intervalSeconds}s)`);

  return () => {
    stopped = true;
    timers.forEach(clearTimeout);
  };
}
