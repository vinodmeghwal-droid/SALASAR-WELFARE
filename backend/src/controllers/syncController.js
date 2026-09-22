import { eventBus } from '../lib/eventBus.js';

export function createSyncController(syncService) {
  return {
    async status(req, res) {
      res.json(await syncService.getStatus());
    },

    /** POST /api/sync { force?: boolean } — "Sync now" button. */
    async trigger(req, res) {
      const result = await syncService.sync({ trigger: 'manual', force: Boolean(req.body?.force) });
      res.json(result);
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
