import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { isDatabaseReady } from './config/db.js';
import { requireApiKey } from './middleware/requireApiKey.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createApiRouter } from './routes/index.js';

export function createApp({ env, syncService }) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()) }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (req, res) => {
    const ready = isDatabaseReady();
    res.status(ready ? 200 : 503).json({ ok: ready, database: ready ? 'connected' : 'disconnected' });
  });

  app.use('/api', requireApiKey(env.INTERNAL_API_KEY), createApiRouter({ syncService }));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
