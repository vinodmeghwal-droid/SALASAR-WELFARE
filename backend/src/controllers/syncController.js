import { eventBus } from '../lib/eventBus.js';
import { badRequest } from '../lib/httpError.js';

export function createSyncController(registry) {
  return {
    /** GET /api/sync/status — one entry per synced workbook. */
    async status(req, res) {
      res.json({ datasets: await registry.statuses() });
    },

    /** POST /api/sync { dataset?, force? } — "Sync now"; all workbooks unless one is named. */
    async trigger(req, res) {
      const { dataset, force } = req.body ?? {};
      if (dataset) {
        const service = registry.get(dataset);
        if (!service) throw badRequest(`Unknown dataset "${dataset}"`);
        return res.json({ results: [await service.sync({ trigger: 'manual', force: Boolean(force) })] });
      }
      res.json({ results: await registry.syncAll({ trigger: 'manual', force: Boolean(force) }) });
    },

    /** GET /api/events — Server-Sent Events stream of sync lifecycle events. */
    events(req, res) {
      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      res.flushHeaders();
      res.write('retry: 5000\n\n');

      const send = (event) => (data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      const handlers = {
        'sync:started': send('sync-started'),
        'sync:completed': send('sync-completed'),
        'sync:failed': send('sync-failed'),
      };
      for (const [name, fn] of Object.entries(handlers)) eventBus.on(name, fn);
      const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000);

      req.on('close', () => {
        clearInterval(heartbeat);
        for (const [name, fn] of Object.entries(handlers)) eventBus.off(name, fn);
      });
    },
  };
}
