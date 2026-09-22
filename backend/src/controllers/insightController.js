export function createInsightController(insightService) {
  return {
    /** GET /api/officer-return/insights?period=annual|apr…mar&fy=&refresh=1 */
    async get(req, res) {
      const period = String(req.query.period ?? 'annual').toLowerCase();
      res.json(
        await insightService.getInsight({ period, fy: req.query.fy, refresh: req.query.refresh === '1' }),
      );
    },
  };
}
