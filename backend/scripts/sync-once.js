// Run one forced sync of every workbook into MongoDB, then exit.
// Usage: npm run sync:once [-- <dataset-key>]
import { env } from '../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { createDatasetRegistry } from '../src/config/datasets.js';

await connectDatabase(env.MONGODB_URI, { dnsFallbackServers: env.DNS_FALLBACK_SERVERS });
try {
  const registry = createDatasetRegistry(env);
  const only = process.argv[2];
  const results = only
    ? [await registry.get(only).sync({ trigger: 'manual', force: true })]
    : await registry.syncAll({ trigger: 'manual', force: true });
  console.log(results);
} finally {
  await disconnectDatabase();
}
