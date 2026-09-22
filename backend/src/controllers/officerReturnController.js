import * as officerReturnService from '../services/officerReturnService.js';

export async function listYears(req, res) {
  res.json({ years: await officerReturnService.listFinancialYears() });
}

export async function getOverview(req, res) {
  res.json(await officerReturnService.getOverview(req.query.fy));
}

export async function getMonth(req, res) {
  res.json(await officerReturnService.getMonth(req.params.month.toLowerCase(), req.query.fy));
}
