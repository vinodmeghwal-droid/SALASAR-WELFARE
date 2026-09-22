import { Router } from 'express';
import * as officerReturn from '../controllers/officerReturnController.js';
import { createSyncController } from '../controllers/syncController.js';

/**
 * /api
 *   GET  /officer-return/years
 *   GET  /officer-return/overview?fy=2026-27
 *   GET  /officer-return/months/:month?fy=2026-27     (month = apr … mar)
 *   GET  /sync/status
 *   POST /sync                                        { force?: boolean }
 *   GET  /events                                      (SSE)
 */
export function createApiRouter({ syncService }) {
  const router = Router();
  const sync = createSyncController(syncService);

  router.get('/officer-return/years', officerReturn.listYears);
  router.get('/officer-return/overview', officerReturn.getOverview);
  router.get('/officer-return/months/:month', officerReturn.getMonth);

  router.get('/sync/status', sync.status);
  router.post('/sync', sync.trigger);
  router.get('/events', sync.events);

  return router;
}
