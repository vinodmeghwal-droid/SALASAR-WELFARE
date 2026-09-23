import { Router } from 'express';
import * as officerReturn from '../controllers/officerReturnController.js';
import * as accidentTracker from '../controllers/accidentTrackerController.js';
import { createSyncController } from '../controllers/syncController.js';
import { createInsightController } from '../controllers/insightController.js';

/**
 * /api
 *   GET  /officer-return/years | /overview?fy= | /months/:month?fy=   (month = apr … mar)
 *   GET  /accident-tracker/years | /overview?fy= | /incidents?fy=&month=&type=&status=&department=
 *   GET  /insights?dataset=officer-return|accident-tracker&period=annual|<month>&refresh=1
 *   GET  /sync/status            (one entry per workbook)
 *   POST /sync                   { dataset?, force? }
 *   GET  /events                 (SSE)
 */
export function createApiRouter({ syncRegistry, insightService }) {
  const router = Router();
  const sync = createSyncController(syncRegistry);
  const insights = createInsightController(insightService);

  router.get('/officer-return/years', officerReturn.listYears);
  router.get('/officer-return/overview', officerReturn.getOverview);
  router.get('/officer-return/months/:month', officerReturn.getMonth);

  router.get('/accident-tracker/years', accidentTracker.listYears);
  router.get('/accident-tracker/overview', accidentTracker.getOverview);
  router.get('/accident-tracker/incidents', accidentTracker.getIncidents);

  router.get('/insights', insights.get);
  router.get('/officer-return/insights', insights.get); // legacy path (defaults to officer-return)

  router.get('/sync/status', sync.status);
  router.post('/sync', sync.trigger);
  router.get('/events', sync.events);

  return router;
}
