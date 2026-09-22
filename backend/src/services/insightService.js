import { AiInsight } from '../models/index.js';
import { hashOf } from '../domain/officerReturn/monthRecord.js';
import {
  INSIGHT_SCHEMA,
  INSIGHT_SYSTEM,
  buildAnnualContext,
  buildInsightPrompt,
  buildMonthContext,
} from '../domain/officerReturn/insightPrompt.js';
import { MONTH_BY_KEY } from '../parsers/officerReturn/schema.js';
import { badRequest, HttpError } from '../lib/httpError.js';
import * as officerReturnService from './officerReturnService.js';

/**
 * Gemini analysis of a period ("annual" or a month key), cached by a hash of its input data.
 * Unchanged data never costs a second API call; any workbook change yields a new hash.
 */
export function createInsightService({ gemini }) {
  const inFlight = new Map(); // dedupe concurrent requests (e.g. many tabs refetching after a sync)

  async function buildContext(period, fy) {
    if (period === 'annual') {
      const overview = await officerReturnService.getOverview(fy);
      if (!overview.submittedCount) throw new HttpError(409, 'No monthly return has been submitted yet');
      return { fy: overview.fy, context: buildAnnualContext(overview) };
    }
    if (!MONTH_BY_KEY[period]) throw badRequest(`Unknown period "${period}"`);
    const record = await officerReturnService.getMonth(period, fy);
    if (!record.hasData) throw new HttpError(409, `${record.label} return has not been submitted yet`);
    return { fy: record.fy, context: buildMonthContext(record) };
  }

  async function generate({ fy, period, context, inputHash }) {
    const { data, model } = await gemini.generateJson({
      system: INSIGHT_SYSTEM,
      prompt: buildInsightPrompt(context),
      schema: INSIGHT_SCHEMA,
    });
    const doc = await AiInsight.findOneAndUpdate(
      { fy, period, inputHash },
      { fy, period, inputHash, model, insight: data },
      { upsert: true, returnDocument: 'after', lean: true },
    );
    return doc;
  }

  return {
    enabled: gemini.enabled,

    /** @param {{ period: string, fy?: string, refresh?: boolean }} */
    async getInsight({ period, fy: fyParam, refresh = false }) {
      if (!gemini.enabled) return { enabled: false, insight: null };

      const { fy, context } = await buildContext(period, fyParam);
      const inputHash = hashOf(context);

      if (!refresh) {
        const cached = await AiInsight.findOne({ fy, period, inputHash }).lean();
        if (cached) return present(cached, true);
      }

      const key = `${fy}:${period}:${inputHash}`;
      if (!inFlight.has(key)) {
        inFlight.set(
          key,
          generate({ fy, period, context, inputHash }).finally(() => inFlight.delete(key)),
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
    period: doc.period,
    fy: doc.fy,
    model: doc.model,
    generatedAt: doc.updatedAt,
    insight: doc.insight,
  };
}
