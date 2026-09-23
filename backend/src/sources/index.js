import { createDriveSource } from './driveSource.js';
import { createLocalSource } from './localSource.js';

/**
 * A "source" is anything with `getMetadata()` → { revision, ... } and `download(metadata)` → Buffer.
 * The sync service only depends on that contract.
 *
 * @param {object} env
 * @param {{ fileId: string, localPath?: string }} dataset  which workbook this source reads
 */
export function createSource(env, { fileId, localPath }) {
  if (env.DATA_SOURCE === 'local') return createLocalSource({ path: localPath });

  const useOAuth = env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET && env.GOOGLE_OAUTH_REFRESH_TOKEN;
  return createDriveSource({
    fileId,
    oauth: useOAuth
      ? {
          clientId: env.GOOGLE_OAUTH_CLIENT_ID,
          clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
          refreshToken: env.GOOGLE_OAUTH_REFRESH_TOKEN,
        }
      : null,
    serviceAccount: {
      clientEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      keyFile: env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
    },
  });
}
