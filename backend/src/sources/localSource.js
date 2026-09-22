import { readFile, stat } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

/** Offline development source: a local copy of the workbook. Edit the file and the poller picks it up. */
export function createLocalSource({ path }) {
  const fullPath = resolve(path);

  return {
    kind: 'local',

    async getMetadata() {
      const info = await stat(fullPath);
      return {
        fileId: `local:${fullPath}`,
        fileName: basename(fullPath),
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        webViewLink: null,
        modifiedTime: info.mtime,
        revision: `${info.size}:${info.mtimeMs}`,
      };
    },

    download() {
      return readFile(fullPath);
    },
  };
}
