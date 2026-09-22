import { createDriveSource } from './driveSource.js';
import { createLocalSource } from './localSource.js';

/**
 * A "source" is anything with `getMetadata()` → { revision, ... } and `download(metadata)` → Buffer.
 * The sync service only depends on that contract.
 */
export function createSource(env) {
  if (env.DATA_SOURCE === 'local') return createLocalSource({ path: env.LOCAL_WORKBOOK_PATH });
  return createDriveSource({
    fileId: env.DRIVE_FILE_ID,
    clientEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    keyFile: env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
  });
}
