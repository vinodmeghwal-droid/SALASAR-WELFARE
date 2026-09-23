import * as accidentTrackerService from '../services/accidentTrackerService.js';

export async function listYears(req, res) {
  res.json({ years: await accidentTrackerService.listFinancialYears() });
}

export async function getOverview(req, res) {
  res.json(await accidentTrackerService.getOverview(req.query.fy));
}

export async function getIncidents(req, res) {
  const { fy, month, type, status, department } = req.query;
  res.json(await accidentTrackerService.getIncidents(fy, { month, type, status, department }));
}
