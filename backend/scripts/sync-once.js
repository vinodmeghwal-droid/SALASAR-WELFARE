// Run one forced sync from the configured source into MongoDB, then exit.
// Usage: npm run sync:once
import { env } from '../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { createSource } from '../src/sources/index.js';
import { createSyncService } from '../src/services/syncService.js';

await connectDatabase(env.MONGODB_URI);
try {
  const result = await createSyncService({ source: createSource(env) }).sync({ trigger: 'manual', force: true });
  console.log(result);
} finally {
  await disconnectDatabase();
}
