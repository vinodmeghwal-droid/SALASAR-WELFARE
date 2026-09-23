export function createInsightController(insightService) {
  return {
    /** GET /api/insights?dataset=&period=&fy=&refresh=1 */
    async get(req, res) {
      res.json(
        await insightService.getInsight({
          dataset: String(req.query.dataset ?? 'officer-return').toLowerCase(),
          period: String(req.query.period ?? 'annual').toLowerCase(),
          fy: req.query.fy,
          refresh: req.query.refresh === '1',
        }),
      );
    },
  };
}
