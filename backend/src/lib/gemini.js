import { logger } from './logger.js';
import { HttpError } from './httpError.js';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

/**
 * Minimal Gemini client for structured (JSON-schema) output.
 * Tries each model in order; transient errors (overload, rate limit, timeout) fall through
 * to the next model after a short backoff.
 */
export function createGeminiClient({ apiKey, models, timeoutMs = 60_000 }) {
  return {
    enabled: Boolean(apiKey),

    /** @returns {Promise<{ data: object, model: string }>} */
    async generateJson({ system, prompt, schema, temperature = 0.3 }) {
      if (!apiKey) throw new HttpError(503, 'AI insights are not configured (GEMINI_API_KEY missing)');
      let lastError;

      for (const [i, model] of models.entries()) {
        if (i > 0) await sleep(800 * i);
        try {
          const res = await fetch(`${API}/${model}:generateContent`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
            signal: AbortSignal.timeout(timeoutMs),
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: system }] },
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { temperature, responseMimeType: 'application/json', responseSchema: schema },
            }),
          });
          const body = await res.json().catch(() => ({}));

          if (!res.ok) {
            lastError = new Error(`${model}: ${res.status} ${body.error?.message ?? res.statusText}`);
            if (RETRYABLE.has(res.status) || res.status === 404) {
              logger.warn(`Gemini ${lastError.message.slice(0, 160)} — trying next model`);
              continue;
            }
            throw new HttpError(502, `Gemini request failed: ${body.error?.message ?? res.status}`);
          }

          const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
          if (!text) {
            lastError = new Error(`${model}: empty response (${body.candidates?.[0]?.finishReason ?? 'no candidates'})`);
            continue;
          }
          return { data: JSON.parse(text), model: body.modelVersion ?? model };
        } catch (error) {
          if (error instanceof HttpError) throw error;
          lastError = error;
          logger.warn(`Gemini ${model} failed: ${error.message}`);
        }
      }
      throw new HttpError(503, `AI service is busy right now, please retry shortly (${lastError?.message ?? 'unknown error'})`);
    },
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
