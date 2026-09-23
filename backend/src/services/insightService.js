import { AiInsight } from '../models/index.js';
import { hashOf } from '../domain/officerReturn/monthRecord.js';
import {
  INSIGHT_SCHEMA,
  INSIGHT_SYSTEM,
  buildAnnualContext,
  buildInsightPrompt,
  buildMonthContext,
} from '../domain/officerReturn/insightPrompt.js';
import { ACCIDENT_INSIGHT_SYSTEM, buildAccidentContext } from '../domain/accidentTracker/insightPrompt.js';
import { MONTH_BY_KEY } from '../parsers/officerReturn/schema.js';
import { badRequest, HttpError } from '../lib/httpError.js';
import * as officerReturnService from './officerReturnService.js';
import * as accidentTrackerService from './accidentTrackerService.js';

/**
 * Gemini analysis of one view, cached by a hash of its input data.
 * Unchanged data never costs a second API call; any workbook change yields a new hash.
 *
 * Datasets: "officer-return" (period = annual | apr…mar) and "accident-tracker" (period = annual | <monthId>).
 */
export function createInsightService({ gemini }) {
  const inFlight = new Map(); // dedupe concurrent requests (e.g. many tabs refetching after a sync)

  async function buildContext(dataset, period, fy) {
    if (dataset === 'accident-tracker') {
      const overview = await accidentTrackerService.getOverview(fy);
      if (!overview.totals?.recordedEvents) throw new HttpError(409, 'No incidents recorded yet');
      if (period !== 'annual' && !overview.months.some((m) => m.monthId === period)) {
        throw badRequest(`Unknown period "${period}"`);
      }
      return {
        fy: overview.fy,
        system: ACCIDENT_INSIGHT_SYSTEM,
        context: buildAccidentContext(overview, period === 'annual' ? null : period),
      };
    }

    if (period === 'annual') {
      const overview = await officerReturnService.getOverview(fy);
      if (!overview.submittedCount) throw new HttpError(409, 'No monthly return has been submitted yet');
      return { fy: overview.fy, system: INSIGHT_SYSTEM, context: buildAnnualContext(overview) };
    }
    if (!MONTH_BY_KEY[period]) throw badRequest(`Unknown period "${period}"`);
    const record = await officerReturnService.getMonth(period, fy);
    if (!record.hasData) throw new HttpError(409, `${record.label} return has not been submitted yet`);
    return { fy: record.fy, system: INSIGHT_SYSTEM, context: buildMonthContext(record) };
  }

  async function generate({ dataset, fy, period, system, context, inputHash }) {
    const { data, model } = await gemini.generateJson({
      system,
      prompt: buildInsightPrompt(context),
      schema: INSIGHT_SCHEMA,
    });
    return AiInsight.findOneAndUpdate(
      { dataset, fy, period, inputHash },
      { dataset, fy, period, inputHash, model, insight: data },
      { upsert: true, returnDocument: 'after', lean: true },
    );
  }

  return {
    enabled: gemini.enabled,

    /** @param {{ dataset?: string, period: string, fy?: string, refresh?: boolean }} */
    async getInsight({ dataset = 'officer-return', period, fy: fyParam, refresh = false }) {
      if (!gemini.enabled) return { enabled: false, insight: null };

      const { fy, system, context } = await buildContext(dataset, period, fyParam);
      const inputHash = hashOf(context);

      if (!refresh) {
        const cached = await AiInsight.findOne({ dataset, fy, period, inputHash }).lean();
        if (cached) return present(cached, true);
      }

      const key = `${dataset}:${fy}:${period}:${inputHash}`;
      if (!inFlight.has(key)) {
        inFlight.set(
          key,
          generate({ dataset, fy, period, system, context, inputHash }).finally(() => inFlight.delete(key)),
        );
      }
      return present(await inFlight.get(key), false);
    },
  };
}

function present(doc, cached) {
  return {
    enabled: true,
    cached,
    dataset: doc.dataset,
    period: doc.period,
    fy: doc.fy,
    model: doc.model,
    generatedAt: doc.updatedAt,
    insight: doc.insight,
  };
}
