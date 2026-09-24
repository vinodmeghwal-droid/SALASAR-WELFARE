import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { logger } from './lib/logger.js';
import { createDatasetRegistry } from './config/datasets.js';
import { startSyncScheduler } from './jobs/syncScheduler.js';
import { createApp } from './app.js';
import { createGeminiClient } from './lib/gemini.js';
import { createInsightService } from './services/insightService.js';

await connectDatabase(env.MONGODB_URI, { dnsFallbackServers: env.DNS_FALLBACK_SERVERS });

const syncRegistry = createDatasetRegistry(env);
const gemini = createGeminiClient({
  apiKey: env.GEMINI_API_KEY,
  models: [env.GEMINI_MODEL, ...env.GEMINI_FALLBACK_MODELS.split(',').map((m) => m.trim()).filter(Boolean)],
});
const insightService = createInsightService({ gemini });
const app = createApp({ env, syncRegistry, insightService });

const server = app.listen(env.PORT, () => {
  logger.info(
    `HR Welfare API listening on http://localhost:${env.PORT} (source: ${env.DATA_SOURCE}, datasets: ${syncRegistry.all
      .map((s) => s.key)
      .join(', ')})`,
  );
});

const stopScheduler = startSyncScheduler(syncRegistry, { intervalSeconds: env.SYNC_INTERVAL_SECONDS });

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
