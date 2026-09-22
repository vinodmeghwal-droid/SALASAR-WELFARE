import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { logger } from './lib/logger.js';
import { createSource } from './sources/index.js';
import { createSyncService } from './services/syncService.js';
import { startSyncScheduler } from './jobs/syncScheduler.js';
import { createApp } from './app.js';
import { createGeminiClient } from './lib/gemini.js';
import { createInsightService } from './services/insightService.js';

await connectDatabase(env.MONGODB_URI);

const source = createSource(env);
const syncService = createSyncService({ source });
const gemini = createGeminiClient({
  apiKey: env.GEMINI_API_KEY,
  models: [env.GEMINI_MODEL, ...env.GEMINI_FALLBACK_MODELS.split(',').map((m) => m.trim()).filter(Boolean)],
});
const insightService = createInsightService({ gemini });
const app = createApp({ env, syncService, insightService });

const server = app.listen(env.PORT, () => {
  logger.info(`HR Welfare API listening on http://localhost:${env.PORT} (source: ${source.kind})`);
});

const stopScheduler = startSyncScheduler(syncService, { intervalSeconds: env.SYNC_INTERVAL_SECONDS });

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down`);
  stopScheduler();
  server.closeAllConnections(); // SSE streams would otherwise hold close() open
  server.close();
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
